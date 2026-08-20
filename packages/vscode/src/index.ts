import path from 'node:path';
import { template } from 'lodash-es';
import * as vscode from 'vscode';
import { window } from 'vscode';
import { analyze } from './analyze';
import { getLauguageConfig, getVisConfigByTheme } from './config';
import * as meta from './generated-meta';
import { activateHighlighting } from './highlight';

const visTemplate = template(`<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <script type="text/javascript" src="<%= libVis %>"></script>
    <script src="<%= libTailwind %>"></script>
    <script src="<%= libIndex %>"></script>
    <link href="<%= visStyle %>" type="text/css">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            scale: {
              '80': '0.8',
            }
          }
        }
      }
    </script>

    <style type="text/css">
        html,body {
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        .app-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        #mynetwork {
            width: 100%;
            height: 100%;
        }
        .hook-tabs {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 12px;
            border-bottom: 1px solid #e5e7eb;
            background: #f8f9fa;
            overflow-x: auto;
            flex-shrink: 0;
        }
        .hook-tab {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            background: white;
            color: #6b7280;
            transition: all 0.2s;
        }
        .hook-tab:hover {
            color: #374151;
            background: #f3f4f6;
        }
        .hook-tab.active {
            background: #f59e0b;
            color: white;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .hook-tab:first-child {
            margin-left: 0;
        }
    </style>
</head>
<body>
<div class="app-container">
  <div id="hookTabsContainer" class="hook-tabs" style="display:none;">
  </div>
  <div class="relative" style="width:100%;flex:1;min-height:0;">
    <div id="SearchInputContainer" class="absolute right-[10px] top-[5px] z-50">
      <input
        id="searchInput"
        placeholder="search by node name"
        class="
          w-[200px]
          px-4 py-2
          border-[#ddd] border-[1px] border-solid rounded-md
          bg-transparent
          shadow
          backdrop-blur
        "
      >
    </div>
    <div id="mynetwork"></div>
    <div
      class="
        absolute right-[10px] top-[50px] p-2
        border border-solid border-[#eee]
        shadow-light-500 
      flex flex-col gap-2
      backdrop-blur
    "
  >
  <div class="flex items-center align-baseline">
    <div
      class="
        inline-block mr-1
        bg-[<%= legend_used %>] 
        border border-solid border-[#3d7de4]
        w-[10px] h-[10px]
      "
    ></div>
    <span>USED</span>
  </div>
  <div class="flex items-center align-baseline">
    <div
      class="
        inline-block mr-1
        bg-[<%= legend_normal %>] 
        border border-solid border-[#ddd]
        w-[10px] h-[10px]
      "
    ></div>
    <span>NOT USED</span>
  </div>
  <div class="flex items-center align-baseline">
    <div
      class="
        inline-block mr-1
        border border-solid border-[<%= legend_variant %>]
        rounded-full 
        w-[10px] h-[10px]
      "
    ></div>
    <span>Variant</span>
  </div>
  <div class="flex items-center align-baseline">
    <div
      class="
        inline-block mr-1
        border border-solid border-[<%= legend_func %>]
        rotate-45 transform scale-80
        w-[10px] h-[10px]
      "
    ></div>
    <span>Function</span>
  </div>
  </div>
</div>
</div>

<script type="text/javascript">
init(
  decodeURIComponent(atob(\`<%= data %>\`)),
  decodeURIComponent(atob(\`<%= config %>\`)),
  decodeURIComponent(atob(\`<%= allHooks %>\`))
);
const inputEle = findSearchInput();
if(inputEle) {
  inputEle.addEventListener('input', (e) => {
    const searchKey = e.target.value;
    if(searchKey && network) {
      // TODO: support fuzzy matching
      network.selectNodes(network.findNode(searchKey), true);
      if(network.findNode(searchKey).length > 0){
        network.focus(network.findNode(searchKey)[0], {
          scale: 1.0,
          animation: {
            duration: 400,
            easingFunction: 'easeInOutQuad',
          },
        });
      }
    }
  });
}
</script>
</body>
</html>`);

function getWebviewUri(webview: vscode.Webview, extensionPath: string, filename: string, dir: string = 'script') {
  const jsFilePath = vscode.Uri.file(path.resolve(
    extensionPath,
    `./${dir}/${filename}`,
  ));
  return webview.asWebviewUri(jsFilePath);
}

const outputChannel = window.createOutputChannel('Vue Hook Optimizer');

let alerted = false;

/** Last created webview panel, exposed for E2E testing */
export const lastPanel: vscode.WebviewPanel | null = null;

export function activate(context: vscode.ExtensionContext) {
  activateHighlighting(context);

  context.subscriptions.push(vscode.commands.registerCommand(meta.commands.vhoActionAnalyze, async () => {
    // 根据主题获取vis config
    const config = getVisConfigByTheme();
    // 获取当前vue文件的内容
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    const document = editor.document;
    const code = document.getText();
    const res = await analyze(code, getLauguageConfig());

    if (res.code !== 0) {
      window.showErrorMessage(res.msg);
      return;
    }
    const data = res.data!;
    const filePath = document.fileName;
    const fileName = filePath.split('/').pop();

    interface HookItem {
      hookName: string
      vis: { nodes: any[], edges: any[] }
      mermaid: string
      suggests: Array<{ type: string, message: string }>
    }
    const allHooks = (data as any)._allHooks as HookItem[] | undefined;
    const panel = window.createWebviewPanel(
      'vueHookOptimizerAnalyze', // viewType
      `Analyze ${fileName}`, // 视图标题
      vscode.ViewColumn.One, // 显示在编辑器的哪个部位
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.resolve(context.extensionPath)),
        ],
        retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
      },
    );

    panel.webview.html = visTemplate({
      libVis: getWebviewUri(panel.webview, context.extensionPath, 'vis-network.min.js'),
      visStyle: getWebviewUri(panel.webview, context.extensionPath, 'vis-network.min.css'),
      libTailwind: getWebviewUri(panel.webview, context.extensionPath, 'tailwindcss.min.js'),
      libIndex: getWebviewUri(panel.webview, context.extensionPath, 'index.js'),
      data: btoa(encodeURIComponent(JSON.stringify(data.vis))),
      config: btoa(encodeURIComponent(JSON.stringify(config?.vis))),
      allHooks: btoa(encodeURIComponent(JSON.stringify(allHooks || []))),
      legend_used: config?.legend.used,
      legend_normal: config?.legend.normal,
      legend_variant: config?.legend.variant,
      legend_func: config?.legend.func,
    });

    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'nodeClick':
          {
            const { line, column } = message.info;
            const position = new vscode.Position(line, column);
            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
            break;
          }
        }
      },
      undefined,
      context.subscriptions,
    );

    outputChannel.append(`${fileName}: \n`);
    outputChannel.append(`Mermaid: \n${data.mermaid}\n`);
    data.suggests.forEach((suggest) => {
      outputChannel.append(`[${
        suggest.type === 'info'
          ? 'Info'
          : suggest.type === 'warning'
            ? 'Warning'
            : suggest.type === 'error'
              ? 'Error'
              : 'Unknown'
      }] ${suggest.message} \n`);
    });

    if (allHooks && allHooks.length > 1) {
      outputChannel.append(`\n--- All ${allHooks.length} hooks ---\n`);
      for (const hook of allHooks) {
        outputChannel.append(`\n## ${hook.hookName}\n`);
        outputChannel.append(`Mermaid: \n${hook.mermaid}\n`);
        hook.suggests.forEach((s) => {
          outputChannel.append(`[${s.type}] ${s.message}\n`);
        });
      }
    }
    outputChannel.append('\n');

    if (!alerted) {
      window.showInformationMessage(
        'Vue Hook Optimizer: Analyze Done! Please check the output channel for suggestions.',
      );
      // toggle output channel
      outputChannel.show();
      alerted = true;
    }
  }));
}

export function deactivate() {

}
