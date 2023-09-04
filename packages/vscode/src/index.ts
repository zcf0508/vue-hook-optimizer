import * as vscode from 'vscode';
import { window } from 'vscode';
import { analyze } from './analyze';
import { template } from 'lodash-es';
import path from 'path';

const visTemplate = template(`<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <script type="text/javascript" src="<%= libVis %>"></script>
    <script src="<%= libTailwind %>"></script>
    <script src="<%= libIndex %>"></script>
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
        shadow
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
        bg-[#9dc2f9] 
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
        bg-[#eee] 
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
        border border-solid border-[#333]
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
        border border-solid border-[#333]
        rotate-45 transform scale-80
        w-[10px] h-[10px]
      "
    ></div>
    <span>Function</span>
  </div>
  </div>
</div>

<script type="text/javascript">
init('<%= data %>')
const inputEle = findSearchInput();
if(inputEle) {
  inputEle.addEventListener('input', (e) => {
    const searchKey = e.target.value;
    if(searchKey && network) {
      // TODO: support fuzzy matching
      network.selectNodes(network.findNode(searchKey), true);
    }
  });
}
</script>
</body>
</html>`);

function getWebviewUri(webview: vscode.Webview, extensionPath: string, filename: string) {
  const jsFilePath = vscode.Uri.file(path.resolve(
    extensionPath, 
    `./script/${filename}`
  ));
  return webview.asWebviewUri(jsFilePath);
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('vho.action.analyze', async () => {
    // 获取当前vue文件的内容
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    const document = editor.document;
    const code = document.getText();
    const res = await analyze(code);
    console.log(res);

    if(res.code !== 0) {
      window.showErrorMessage(res.msg);
      return;
    }
    
    const fileName = document.fileName.split('/').pop();
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
      libTailwind: getWebviewUri(panel.webview, context.extensionPath, 'tailwindcss.min.js'),
      libIndex: getWebviewUri(panel.webview, context.extensionPath, 'index.js'),
      data: JSON.stringify(res.data),
    });
  }));
}

export function deactivate() {

}