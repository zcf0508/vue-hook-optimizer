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
  <div id="mynetwork"></div>
  <div 
    class="
      absolute right-[10px] top-[10px] p-2
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
    // 获取容器
    var container = document.getElementById('mynetwork');

    // 将数据赋值给vis 数据格式化器
    var data = JSON.parse('<%= data %>');
    var options = {
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -100,
        },
      },
      groups: {
        used: {
          color: {
            border: '#3d7de4',
            background: '#9dc2f9',
            highlight: {
              border: '#3d7de4',
              background: '#9dc2f9',
            },
          },
        },
        normal: {
          color: {
            border: '#ccc',
            background: '#ddd',
            highlight: {
              border: '#ccc',
              background: '#ddd',
            },
          },
        },
      },
    };

    // 初始化关系图
    var network = new vis.Network(container, data, options);
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
      data: JSON.stringify(res.data),
    });
  }));
}

export function deactivate() {

}