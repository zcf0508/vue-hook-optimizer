let network: any;

function init(dataString: string) {
  // 获取容器
  var container = document.getElementById('mynetwork');

  // 将数据赋值给vis 数据格式化器
  var data = JSON.parse(dataString);
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
  // @ts-ignore
  network = new vis.Network(container, data, options);
}

function findSearchContainer() {
  return document.getElementById('SearchInputContainer');
}

function findSearchInput() {
  return document.getElementById('searchInput') as HTMLInputElement | null;
}
