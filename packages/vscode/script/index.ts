// @ts-expect-error vscode
const vscode = acquireVsCodeApi();

let network: any;

function init(dataString: string, theme: string) {
  // 获取容器
  const container = document.getElementById('mynetwork');

  // 将数据赋值给vis 数据格式化器
  const data = JSON.parse(dataString);
  const options = Object.assign({
    physics: {
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -100,
      },
    },
  }, JSON.parse(theme));

  // 初始化关系图
  // @ts-expect-error window.vis
  network = new vis.Network(container, data, options);

  // 监听节点点击事件
  network.on('click', (event: any) => {
    const { nodes } = event;
    if (nodes.length) {
      onNodeClick(data.nodes.find((node: any) => node.id === nodes[0])?.info);
    }
  });
}

function findSearchContainer() {
  return document.getElementById('SearchInputContainer');
}

function findSearchInput() {
  return document.getElementById('searchInput') as HTMLInputElement | null;
}

function onNodeClick(info?: { line: number, column: number }) {
  console.log(info);
  if (!info) {
    return;
  }
  vscode.postMessage({
    command: 'nodeClick',
    info,
  });
}
