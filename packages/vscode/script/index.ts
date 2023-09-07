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
  // @ts-ignore
  network = new vis.Network(container, data, options);
}

function findSearchContainer() {
  return document.getElementById('SearchInputContainer');
}

function findSearchInput() {
  return document.getElementById('searchInput') as HTMLInputElement | null;
}
