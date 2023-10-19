import * as vscode from 'vscode';
import { window } from 'vscode';
import { analyze } from './analyze';
import { template } from 'lodash-es';
import { light, dark } from './themes';
import path from 'path';

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
            margin: none;
            padding: none;
        }
        #mynetwork {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
<div class="h-full w-full relative">
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
    <span>USED IN TEMPLATE</span>
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
    <span>NOT USED IN TEMPLATE</span>
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

<script type="text/javascript">
init(decodeURIComponent(atob(\`<%= data %>\`)), decodeURIComponent(atob(\`<%= config %>\`)));
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
    `./${dir}/${filename}`
  ));
  return webview.asWebviewUri(jsFilePath);
}


const outputChannel = window.createOutputChannel('Vue Hook Optimizer');

let alerted = false;

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('vho.action.analyze', async () => {
    // 根据主题获取vis config
    const config = getVisConfigByTheme();
    // 获取当前vue文件的内容
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    const document = editor.document;
    const code = document.getText();
    const res = await analyze(code);

    if(res.code !== 0) {
      window.showErrorMessage(res.msg);
      return;
    }
    const filePath = document.fileName;
    const fileName = filePath.split('/').pop();
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
      }
    );

    panel.webview.html = visTemplate({
      libVis: getWebviewUri(panel.webview, context.extensionPath, 'vis-network.min.js'),
      visStyle: getWebviewUri(panel.webview, context.extensionPath, 'vis-network.min.css'),
      libTailwind: getWebviewUri(panel.webview, context.extensionPath, 'tailwindcss.min.js'),
      libIndex: getWebviewUri(panel.webview, context.extensionPath, 'index.js'),
      data: btoa(encodeURIComponent(JSON.stringify(res.data.vis))),
      config: btoa(encodeURIComponent(JSON.stringify(config?.vis))),
      legend_used: config?.legend.used,
      legend_normal: config?.legend.normal,
      legend_variant: config?.legend.variant,
      legend_func: config?.legend.func,
    });

    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'nodeClick':
            const { line, column } = message.info;
            const position = new vscode.Position(line, column);
            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    outputChannel.append(`${fileName}: \n`);
    res.data.suggests.forEach(suggest => {
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
    outputChannel.append('\n');

    if(!alerted) {
      window.showInformationMessage(
        'Vue Hook Optimizer: Analyze Done! Please check the output channel for suggestions.',
      );
      // toggle output channel
      outputChannel.show();
      alerted = true;
    }

  }));
}

function getVisConfigByTheme () {
  const config = vscode.workspace.getConfiguration('vho');
  const theme = config.get('theme');

  if (theme === 'auto') {
    const themeKind = vscode.window.activeColorTheme.kind;
    if (themeKind === 2 || themeKind === 3) {
      return dark;
    } else if (themeKind === 1 || themeKind === 4) {
      return light;
    } else {
      outputChannel.append('The current theme is not supported at the moment, so it will be set as light theme.');
      return light;
    }
  } else if (theme === 'light') {
    return light;
  } else if (theme === 'dark') {
    return dark;
  }
}

export function deactivate() {

}
