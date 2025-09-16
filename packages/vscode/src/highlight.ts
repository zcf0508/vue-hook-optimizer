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
  let lastSelectedWord = '';

  async function updateDecorations() {
    const highlight = getHighlightConfig();
    if (!highlight) {
      return;
    }

    if (!activeEditor) {
      return;
    }

    const code = activeEditor.document.getText();

    if (!code) {
      return;
    }

    const selection = activeEditor.selection;
    const selectedWordRange = activeEditor.document.getWordRangeAtPosition(selection.start);

    if (!selectedWordRange) {
      clearDecorations(activeEditor);
      return;
    }

    const selectedWord = activeEditor.document.getText(selectedWordRange);

    if (selectedWord === lastSelectedWord) {
      return;
    }

    lastSelectedWord = selectedWord;

    const codeHash = hashCode(code);
    const fileUri = activeEditor.document.uri.toString();

    let analysisResult;
    const cachedEntry = analysisCache.get(fileUri);

    if (cachedEntry && cachedEntry.hash === codeHash) {
      analysisResult = cachedEntry.result;
    }
    else {
      analysisResult = await analyze(code, getLauguageConfig());
      analysisCache.set(fileUri, {
        hash: codeHash,
        result: analysisResult,
        timestamp: Date.now(),
      });
    }

    const { nodes, edges } = analysisResult.data.vis;

    const selectedNode = nodes.find(node => node.label === selectedWord);

    if (!selectedNode) {
      clearDecorations(activeEditor);
      return;
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

    const dependencies = [...dependencyLines].map(line => activeEditor!.document.lineAt(line).range);
    const dependents = [...dependentLines].map(line => activeEditor!.document.lineAt(line).range);

    activeEditor.setDecorations(dependencyDecorationType, dependencies);
    activeEditor.setDecorations(dependentDecorationType, dependents);
  }

  const triggerUpdateDecorations = debounce(updateDecorations, 300);

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.workspace.onDidChangeTextDocument((event) => {
    const fileUri = event.document.uri.toString();
    analysisCache.delete(fileUri);
  }, null, context.subscriptions);

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    activeEditor = editor;
    lastSelectedWord = '';
    if (editor) {
      clearDecorations(activeEditor!);
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  vscode.window.onDidChangeTextEditorSelection((event) => {
    if (activeEditor && event.textEditor === activeEditor) {
      clearDecorations(activeEditor!);
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);
}
