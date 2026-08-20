// @ts-expect-error vscode
const vscode = acquireVsCodeApi();

let network: any;
let allHooksData: any[] = [];
let currentData: any = null;

function init(dataString: string, theme: string, allHooksString?: string) {
  // 获取容器
  const container = document.getElementById('mynetwork');

  // 将数据赋值给vis 数据格式化器
  const data = JSON.parse(dataString);
  currentData = data;
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
      onNodeClick(currentData.nodes.find((node: any) => node.id === nodes[0])?.info);
    }
  });

  // 初始化 hook tabs
  if (allHooksString) {
    try {
      allHooksData = JSON.parse(allHooksString);
      if (allHooksData.length > 1) {
        renderHookTabs(allHooksData, 0);
      }
    }
    catch {
      // ignore parse errors
    }
  }
}

function renderHookTabs(hooks: any[], activeIndex: number) {
  const container = document.getElementById('hookTabsContainer');
  if (!container) {
    return;
  }

  container.style.display = 'flex';
  container.innerHTML = '';

  hooks.forEach((hook, index) => {
    const btn = document.createElement('button');
    btn.className = `hook-tab${index === activeIndex
      ? ' active'
      : ''}`;
    btn.textContent = hook.hookName;
    btn.addEventListener('click', () => switchHook(index));
    container.appendChild(btn);
  });
}

function switchHook(index: number) {
  if (!network || index >= allHooksData.length) {
    return;
  }

  const hook = allHooksData[index];
  if (!hook.vis) {
    return;
  }

  currentData = hook.vis;
  network.setData(hook.vis);

  // Update active tab
  const container = document.getElementById('hookTabsContainer');
  if (container) {
    const tabs = container.querySelectorAll('.hook-tab');
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });
  }
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
