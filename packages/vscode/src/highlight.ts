import { debounce } from 'lodash-es';
import * as vscode from 'vscode';
import { generateCommunityColorsRGBA } from '../../../packages/core/src';
import { analyze } from './analyze';
import { getCommunityColorsConfig, getHighlightConfig, getLauguageConfig } from './config';

interface CacheEntry {
  hash: string
  result: Awaited<ReturnType<typeof analyze>>
  timestamp: number
}

class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 20;

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.cache.set(key, entry);
    }
    return entry;
  }

  set(key: string, entry: CacheEntry): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      firstKey && this.cache.delete(firstKey);
    }
    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

const analysisCache = new LRUCache();

const dependencyDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(122, 198, 253, 0.2)',
  isWholeLine: true,
  overviewRulerColor: 'rgba(122, 198, 253, 0.8)',
  overviewRulerLane: vscode.OverviewRulerLane.Full,
  before: {
    contentText: '˄',
    color: 'rgba(122, 198, 253, 0.8)',
    fontWeight: 'bold',
    margin: '0 4px 0 0',
  },
});

const dependentDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(115, 201, 159, 0.2)',
  isWholeLine: true,
  overviewRulerColor: 'rgba(115, 201, 159, 0.8)',
  overviewRulerLane: vscode.OverviewRulerLane.Full,
  before: {
    contentText: '˅',
    color: 'rgba(115, 201, 159, 0.8)',
    fontWeight: 'bold',
    margin: '0 4px 0 0',
  },
});

function clearDecorations(editor: vscode.TextEditor) {
  editor.setDecorations(dependencyDecorationType, []);
  editor.setDecorations(dependentDecorationType, []);
}

const MAX_COMMUNITY_COLORS = 20;
let communityDecorationTypes: vscode.TextEditorDecorationType[] = [];

function createCommunityDecorationTypes(): vscode.TextEditorDecorationType[] {
  disposeCommunityDecorationTypes();

  const colors = generateCommunityColorsRGBA(MAX_COMMUNITY_COLORS);
  communityDecorationTypes = colors.map((color, index) => {
    return vscode.window.createTextEditorDecorationType({
      backgroundColor: color.background,
      borderWidth: '0 0 0 3px',
      borderStyle: 'solid',
      borderColor: color.border,
      overviewRulerColor: color.foreground,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      before: {
        contentText: '●',
        color: color.foreground,
        margin: '0 6px 0 0',
      },
    });
  });

  return communityDecorationTypes;
}

function disposeCommunityDecorationTypes() {
  communityDecorationTypes.forEach(type => type.dispose());
  communityDecorationTypes = [];
}

function clearCommunityDecorations(editor: vscode.TextEditor) {
  communityDecorationTypes.forEach((type) => {
    editor.setDecorations(type, []);
  });
}

export function activateHighlighting(context: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor;

  /** 缓存当前文件的analysis结果，避免重复analyze */
  let currentAnalysisResult: Awaited<ReturnType<typeof analyze>> | null = null;

  /** 缓存上次高亮的行号，用于避免闪烁 */
  let lastDependencyLines = new Set<number>();
  let lastDependentLines = new Set<number>();

  /** 缓存上次社区着色状态 */
  let lastCommunityColorsEnabled = false;

  /** 是否已经显示过本次会话的首次提示 */
  let hasShownSessionNotification = false;

  function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    return a.size === b.size && [...a].every(x => b.has(x));
  }

  async function showFirstTimeNotification() {
    if (hasShownSessionNotification) {
      return;
    }

    vscode.window.showInformationMessage(
      'Vue Hook Optimizer: ˄ (requires) ˅ (used by). Can be disabled in settings.',
    );

    hasShownSessionNotification = true;
  }

  async function ensureAnalysisResult() {
    if (!activeEditor) {
      return null;
    }

    const code = activeEditor.document.getText();
    if (!code) {
      return null;
    }

    const codeHash = hashCode(code);
    const fileUri = activeEditor.document.uri.toString();

    // 检查缓存
    const cachedEntry = analysisCache.get(fileUri);
    if (cachedEntry && cachedEntry.hash === codeHash) {
      currentAnalysisResult = cachedEntry.result;
      return currentAnalysisResult;
    }

    // 重新分析
    const analysisResult = await analyze(code, getLauguageConfig());
    analysisCache.set(fileUri, {
      hash: codeHash,
      result: analysisResult,
      timestamp: Date.now(),
    });

    currentAnalysisResult = analysisResult;
    return analysisResult;
  }

  async function updateDecorations() {
    const highlight = getHighlightConfig();
    if (!highlight || !activeEditor) {
      return;
    }

    const selection = activeEditor.selection;
    const selectedWordRange = activeEditor.document.getWordRangeAtPosition(selection.start);

    if (!selectedWordRange) {
      clearDecorations(activeEditor);
      lastDependencyLines.clear();
      lastDependentLines.clear();
      return;
    }

    const selectedWord = activeEditor.document.getText(selectedWordRange);
    const cursorLine = selection.start.line;

    // 确保有分析结果
    const analysisResult = await ensureAnalysisResult();
    if (!analysisResult) {
      return;
    }

    const { nodes, edges } = analysisResult.data.vis;

    // 查找光标位置最近的匹配节点
    const matchingNodes = nodes.filter(node => node.label === selectedWord);
    if (matchingNodes.length === 0) {
      clearDecorations(activeEditor);
      lastDependencyLines.clear();
      lastDependentLines.clear();
      return;
    }

    // 找到最接近光标位置的节点
    let selectedNode = matchingNodes[0];
    if (matchingNodes.length > 1) {
      selectedNode = matchingNodes.reduce((closest, node) => {
        if (!node.info?.line || !closest.info?.line) {
          return closest;
        }
        const nodeDistance = Math.abs(node.info.line - cursorLine);
        const closestDistance = Math.abs(closest.info.line - cursorLine);
        return nodeDistance < closestDistance
          ? node
          : closest;
      });
    }

    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const dependencyLines = new Set<number>();
    const dependentLines = new Set<number>();

    edges.forEach((edge) => {
      if (edge.from === selectedNode.id) {
        const dependencyNode = nodeMap.get(edge.to);
        if (dependencyNode && dependencyNode.info?.line) {
          const line = dependencyNode.info.line;
          if (line >= 0 && line < activeEditor!.document.lineCount) {
            dependencyLines.add(line);
          }
        }
      }
      else if (edge.to === selectedNode.id) {
        const dependentNode = nodeMap.get(edge.from);
        if (dependentNode && dependentNode.info?.line) {
          const line = dependentNode.info.line;
          if (line >= 0 && line < activeEditor!.document.lineCount) {
            dependentLines.add(line);
          }
        }
      }
    });

    // 只有当高亮内容发生变化时才更新装饰
    const dependencyChanged = !setsEqual(dependencyLines, lastDependencyLines);
    const dependentChanged = !setsEqual(dependentLines, lastDependentLines);

    if (dependencyChanged || dependentChanged) {
      const dependencies = [...dependencyLines].map(line => activeEditor!.document.lineAt(line).range);
      const dependents = [...dependentLines].map(line => activeEditor!.document.lineAt(line).range);

      activeEditor.setDecorations(dependencyDecorationType, dependencies);
      activeEditor.setDecorations(dependentDecorationType, dependents);

      lastDependencyLines = new Set(dependencyLines);
      lastDependentLines = new Set(dependentLines);

      // 首次高亮时显示提示
      if (!hasShownSessionNotification && (dependencies.length > 0 || dependents.length > 0)) {
        showFirstTimeNotification();
      }
    }
  }

  async function updateCommunityColors() {
    const communityColorsEnabled = getCommunityColorsConfig();

    if (!activeEditor) {
      return;
    }

    if (!communityColorsEnabled) {
      if (lastCommunityColorsEnabled) {
        clearCommunityDecorations(activeEditor);
        lastCommunityColorsEnabled = false;
      }
      return;
    }

    const analysisResult = await ensureAnalysisResult();
    if (!analysisResult) {
      return;
    }

    const { communities } = analysisResult.data;
    if (!communities || communities.communities.length === 0) {
      clearCommunityDecorations(activeEditor);
      return;
    }

    if (communityDecorationTypes.length === 0) {
      createCommunityDecorationTypes();
    }

    const communityDecorations: Map<number, vscode.Range[]> = new Map();

    for (const community of communities.communities) {
      const colorIndex = community.id % MAX_COMMUNITY_COLORS;
      if (!communityDecorations.has(colorIndex)) {
        communityDecorations.set(colorIndex, []);
      }

      for (const node of community.nodes) {
        if (node.info?.line !== undefined) {
          const line = node.info.line;
          if (line >= 0 && line < activeEditor.document.lineCount) {
            communityDecorations.get(colorIndex)!.push(
              activeEditor.document.lineAt(line).range,
            );
          }
        }
      }
    }

    for (let i = 0; i < communityDecorationTypes.length; i++) {
      const ranges = communityDecorations.get(i) || [];
      activeEditor.setDecorations(communityDecorationTypes[i], ranges);
    }

    lastCommunityColorsEnabled = true;
  }

  const triggerUpdateDecorations = debounce(updateDecorations, 300);
  const triggerUpdateCommunityColors = debounce(updateCommunityColors, 500);

  if (activeEditor) {
    triggerUpdateDecorations();
    triggerUpdateCommunityColors();
  }

  vscode.workspace.onDidChangeTextDocument((event) => {
    const fileUri = event.document.uri.toString();
    analysisCache.delete(fileUri);
    currentAnalysisResult = null;
    if (activeEditor) {
      triggerUpdateCommunityColors();
    }
  }, null, context.subscriptions);

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    activeEditor = editor;
    currentAnalysisResult = null;
    lastDependencyLines.clear();
    lastDependentLines.clear();
    if (editor) {
      clearDecorations(activeEditor!);
      clearCommunityDecorations(activeEditor!);
      triggerUpdateDecorations();
      triggerUpdateCommunityColors();
    }
  }, null, context.subscriptions);

  vscode.window.onDidChangeTextEditorSelection((event) => {
    if (activeEditor && event.textEditor === activeEditor) {
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('vho.communityColors')) {
      if (activeEditor) {
        triggerUpdateCommunityColors();
      }
    }
  }, null, context.subscriptions);

  context.subscriptions.push({
    dispose: () => {
      disposeCommunityDecorationTypes();
    },
  });
}
