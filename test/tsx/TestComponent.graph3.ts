import { NodeType } from '@/analyze/utils';

const edges = new Map<{
  label: string, type: NodeType}, 
  Set<{label: string, type: NodeType}>
>();

const store = {label: 'store', type: NodeType.var};
const configLoaded = {label: 'configLoaded', type: NodeType.var};
const config = {label: 'config', type: NodeType.var};
const terminalFullScreen = {label: 'terminalFullScreen', type: NodeType.var};
const pinned = {label: 'pinned', type: NodeType.var};
const isSencondInstance = {label: 'isSencondInstance', type: NodeType.var};
const pinnedQuickCommandBar = {label: 'pinnedQuickCommandBar', type: NodeType.var};
const wsInited = {label: 'wsInited', type: NodeType.var};
const upgradeInfo = {label: 'upgradeInfo', type: NodeType.var};
const installSrc = {label: 'installSrc', type: NodeType.var};
const uiThemeConfig = {label: 'uiThemeConfig', type: NodeType.var};
const cls = {label: 'cls', type: NodeType.var};
const ext1 = {label: 'ext1', type: NodeType.var};
const cpConf = {label: 'cpConf', type: NodeType.var};
const confsCss = {label: 'confsCss', type: NodeType.var};
const themeProps = {label: 'themeProps', type: NodeType.var};
const outerProps = {label: 'outerProps', type: NodeType.var};


edges.set(store, new Set([]));
edges.set(configLoaded, new Set([]));
edges.set(config, new Set([]));
edges.set(terminalFullScreen, new Set([]));
edges.set(pinned, new Set([]));
edges.set(isSencondInstance, new Set([]));
edges.set(pinnedQuickCommandBar, new Set([]));
edges.set(wsInited, new Set([]));
edges.set(upgradeInfo, new Set([]));
edges.set(installSrc, new Set([]));
edges.set(uiThemeConfig, new Set([]));
edges.set(cls, new Set([configLoaded, store, pinned, pinnedQuickCommandBar, terminalFullScreen, isSencondInstance]));
edges.set(ext1, new Set([cls]));
edges.set(cpConf, new Set([]));
edges.set(confsCss, new Set([cpConf]));
edges.set(themeProps, new Set([store]));
edges.set(outerProps, new Set([config]));


export const graph = {
  nodes: new Set([
    store,
    configLoaded,
    config,
    terminalFullScreen,
    pinned,
    isSencondInstance,
    pinnedQuickCommandBar,
    wsInited,
    upgradeInfo,
    installSrc,
    uiThemeConfig,
    cls,
    ext1,
    cpConf,
    confsCss,
    themeProps,
    outerProps,
  ]),
  edges,
};