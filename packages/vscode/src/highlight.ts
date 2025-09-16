import { debounce } from 'lodash-es';
import * as vscode from 'vscode';
import { analyze } from './analyze';
import { getHighlightConfig, getLauguageConfig } from './config';

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

export function activateHighlighting(context: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor;

  /** 缓存当前文件的analysis结果，避免重复analyze */
  let currentAnalysisResult: Awaited<ReturnType<typeof analyze>> | null = null;

  /** 缓存上次高亮的行号，用于避免闪烁 */
  let lastDependencyLines = new Set<number>();
  let lastDependentLines = new Set<number>();

  function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    return a.size === b.size && [...a].every(x => b.has(x));
  }

  async function ensureAnalysisResult() {
    if (!activeEditor) { return null; }

    const code = activeEditor.document.getText();
    if (!code) { return null; }

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
    if (!analysisResult) { return; }

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
        if (!node.info?.line || !closest.info?.line) { return closest; }
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
    }
  }

  const triggerUpdateDecorations = debounce(updateDecorations, 300);

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.workspace.onDidChangeTextDocument((event) => {
    const fileUri = event.document.uri.toString();
    analysisCache.delete(fileUri);
    currentAnalysisResult = null; // 清空内存中的分析结果
  }, null, context.subscriptions);

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    activeEditor = editor;
    currentAnalysisResult = null; // 切换文件时清空分析结果
    lastDependencyLines.clear();
    lastDependentLines.clear();
    if (editor) {
      clearDecorations(activeEditor!);
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  vscode.window.onDidChangeTextEditorSelection((event) => {
    if (activeEditor && event.textEditor === activeEditor) {
      triggerUpdateDecorations(); // 移除预先清空，让比较逻辑决定是否更新
    }
  }, null, context.subscriptions);
}
