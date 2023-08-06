export { parse } from '@vue/compiler-sfc';
import * as vis_network from 'vis-network';

declare function analyze$1(content: string): Set<string>;

declare function analyze(content: string): {
    nodes: Set<string>;
    edges: Map<string, Set<string>>;
};

declare function getVisData(graph: {
    nodes: Set<string>;
    edges: Map<string, Set<string>>;
}, usedNodes: Set<string>): {
    nodes: vis_network.Node[];
    edges: vis_network.Edge[];
};

export { analyze as analyzeSetupScript, analyze$1 as analyzeTemplate, getVisData };
