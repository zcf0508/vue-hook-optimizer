import { debounce } from 'lodash-es';
import * as vscode from 'vscode';
import { analyze } from './analyze';
import { getHighlightConfig, getLauguageConfig } from './config';

const dependencyDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(122, 198, 253, 0.2)',
  isWholeLine: true,
  overviewRulerColor: 'rgba(122, 198, 253, 0.8)',
  overviewRulerLane: vscode.OverviewRulerLane.Full,
});

const dependentDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(115, 201, 159, 0.2)',
  isWholeLine: true,
  overviewRulerColor: 'rgba(115, 201, 159, 0.8)',
  overviewRulerLane: vscode.OverviewRulerLane.Full,
});

function clearDecorations(editor: vscode.TextEditor) {
  editor.setDecorations(dependencyDecorationType, []);
  editor.setDecorations(dependentDecorationType, []);
}

export function activateHighlighting(context: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor;

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

    const res = await analyze(code, getLauguageConfig());
    const { nodes, edges } = res.data.vis;

    const selectedNode = nodes.find(node => node.label === selectedWord);

    if (!selectedNode) {
      clearDecorations(activeEditor);
      return;
    }

    const dependencyLines = new Set<number>();
    const dependentLines = new Set<number>();

    // Find dependencies (current node depends on)
    edges.forEach((edge) => {
      if (edge.from === selectedNode.id) {
        const dependencyNode = nodes.find(node => node.id === edge.to);
        if (dependencyNode && dependencyNode.info?.line) {
          const line = dependencyNode.info.line;
          if (line >= 0 && line < activeEditor!.document.lineCount) {
            dependencyLines.add(line);
          }
        }
      }
    });

    // Find dependents (nodes that depend on the current node)
    edges.forEach((edge) => {
      if (edge.to === selectedNode.id) {
        const dependentNode = nodes.find(node => node.id === edge.from);
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

  const triggerUpdateDecorations = debounce(updateDecorations, 500);

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    activeEditor = editor;
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
