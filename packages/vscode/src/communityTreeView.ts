import * as vscode from 'vscode';
import type { CommunityResult, TypedNode } from '../../../packages/core/src';
import { generateCommunityColorsRGBA } from '../../../packages/core/src';

export interface CommunityData {
  communities: CommunityResult;
  filePath: string;
}

const MAX_HIGHLIGHT_COLORS = 20;
let communityHighlightDecorations: vscode.TextEditorDecorationType[] = [];

function createHighlightDecorations(): vscode.TextEditorDecorationType[] {
  disposeHighlightDecorations();

  const colors = generateCommunityColorsRGBA(MAX_HIGHLIGHT_COLORS);
  communityHighlightDecorations = colors.map(color =>
    vscode.window.createTextEditorDecorationType({
      backgroundColor: color.background,
      borderWidth: '0 0 0 4px',
      borderStyle: 'solid',
      borderColor: color.foreground,
      overviewRulerColor: color.foreground,
      overviewRulerLane: vscode.OverviewRulerLane.Full,
      isWholeLine: true,
    }),
  );

  return communityHighlightDecorations;
}

function disposeHighlightDecorations(): void {
  communityHighlightDecorations.forEach(d => d.dispose());
  communityHighlightDecorations = [];
}

function clearAllHighlights(editor: vscode.TextEditor): void {
  communityHighlightDecorations.forEach((d) => {
    editor.setDecorations(d, []);
  });
}

type TreeItemData =
  | { type: 'community'; communityId: number; nodes: TypedNode[]; color: string }
  | { type: 'node'; node: TypedNode; communityId: number; color: string };

class CommunityTreeItem extends vscode.TreeItem {
  constructor(
    public readonly data: TreeItemData,
    public readonly filePath: string,
  ) {
    const label = data.type === 'community'
      ? `Community ${data.communityId + 1} (${data.nodes.length})`
      : data.node.label;

    super(
      label,
      data.type === 'community'
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None,
    );

    if (data.type === 'community') {
      this.iconPath = new vscode.ThemeIcon('symbol-class', new vscode.ThemeColor('charts.blue'));
      this.tooltip = `Community ${data.communityId + 1}: ${data.nodes.length} members`;
      this.contextValue = 'community';
    }
    else {
      const nodeType = data.node.type;
      const iconName = nodeType === 'fun' ? 'symbol-method' : 'symbol-variable';
      this.iconPath = new vscode.ThemeIcon(iconName);
      this.tooltip = `${data.node.label} (${nodeType === 'fun' ? 'function' : 'variable'})`;
      this.contextValue = 'node';

      if (data.node.info?.line !== undefined) {
        this.description = `L${data.node.info.line + 1}`;
        this.command = {
          command: 'vho.community.gotoNode',
          title: 'Go to Definition',
          arguments: [this.filePath, data.node.info.line, data.node.info.column || 0],
        };
      }
    }
  }
}

export class CommunityTreeDataProvider implements vscode.TreeDataProvider<CommunityTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<CommunityTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private communityData: CommunityData | null = null;
  private colors: Array<{ background: string; foreground: string; border: string }> = [];
  private selectedCommunityId: number | null = null;

  constructor() {
    this.colors = generateCommunityColorsRGBA(20);
  }

  refresh(data?: CommunityData): void {
    this.communityData = data || null;
    this._onDidChangeTreeData.fire();
  }

  clear(): void {
    this.communityData = null;
    this.selectedCommunityId = null;
    this._onDidChangeTreeData.fire();
  }

  selectCommunity(communityId: number | null): void {
    this.selectedCommunityId = communityId;
  }

  getSelectedCommunityId(): number | null {
    return this.selectedCommunityId;
  }

  getCommunityData(): CommunityData | null {
    return this.communityData;
  }

  getTreeItem(element: CommunityTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CommunityTreeItem): Thenable<CommunityTreeItem[]> {
    if (!this.communityData) {
      return Promise.resolve([]);
    }

    if (!element) {
      const items = this.communityData.communities.communities
        .filter(community => community.nodes.size > 1)
        .map((community) => {
          const nodes = Array.from(community.nodes).sort((a, b) => {
            const lineA = a.info?.line ?? Infinity;
            const lineB = b.info?.line ?? Infinity;
            return lineA - lineB;
          });

          const colorIndex = community.id % this.colors.length;
          return new CommunityTreeItem(
            {
              type: 'community',
              communityId: community.id,
              nodes,
              color: this.colors[colorIndex].foreground,
            },
            this.communityData!.filePath,
          );
        });
      return Promise.resolve(items);
    }

    if (element.data.type === 'community') {
      const items = element.data.nodes.map((node) => {
        return new CommunityTreeItem(
          {
            type: 'node',
            node,
            communityId: element.data.communityId,
            color: element.data.color,
          },
          this.filePath,
        );
      });
      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }

  private get filePath(): string {
    return this.communityData?.filePath || '';
  }
}

export function registerCommunityTreeView(
  context: vscode.ExtensionContext,
  provider: CommunityTreeDataProvider,
): void {
  createHighlightDecorations();

  const treeView = vscode.window.createTreeView('vho.communityView', {
    treeDataProvider: provider,
    showCollapseAll: true,
  });

  context.subscriptions.push(treeView);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vho.community.gotoNode',
      async (filePath: string, line: number, column: number) => {
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document, { preview: false });
        const position = new vscode.Position(line, column);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(
          new vscode.Range(position, position),
          vscode.TextEditorRevealType.InCenter,
        );
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vho.community.refresh', () => {
      provider.refresh();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'vho.community.highlightCommunity',
      async (communityId: number) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          return;
        }

        const data = provider.getCommunityData();
        if (!data) {
          return;
        }

        const community = data.communities.communities.find(c => c.id === communityId);
        if (!community) {
          return;
        }

        clearAllHighlights(editor);

        const colorIndex = communityId % MAX_HIGHLIGHT_COLORS;
        const ranges: vscode.Range[] = [];

        for (const node of community.nodes) {
          if (node.info?.line !== undefined) {
            const line = node.info.line;
            if (line >= 0 && line < editor.document.lineCount) {
              ranges.push(editor.document.lineAt(line).range);
            }
          }
        }

        if (ranges.length > 0) {
          editor.setDecorations(communityHighlightDecorations[colorIndex], ranges);
          editor.revealRange(ranges[0], vscode.TextEditorRevealType.InCenter);
        }

        provider.selectCommunity(communityId);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vho.community.clearHighlight', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        clearAllHighlights(editor);
      }
      provider.selectCommunity(null);
    }),
  );

  treeView.onDidChangeSelection((e) => {
    if (e.selection.length === 0) {
      return;
    }

    const item = e.selection[0];
    if (item.data.type === 'community') {
      vscode.commands.executeCommand('vho.community.highlightCommunity', item.data.communityId);
    }
  });

  context.subscriptions.push({
    dispose: () => {
      disposeHighlightDecorations();
    },
  });
}
