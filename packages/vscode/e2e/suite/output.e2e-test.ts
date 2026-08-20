/* eslint-disable ts/no-require-imports */
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Use dynamic require since the core package is bundled for the extension
// but available at runtime via the workspace symlink
// eslint-disable-next-line antfu/no-top-level-await
const workspacePath = path.join(__dirname, '../../workspace');

function readWorkspaceFile(name: string): string {
  return fs.readFileSync(path.join(workspacePath, name), 'utf-8');
}

suite('Analyze Output', () => {
  suite('Vue SFC (basic.vue)', () => {
    let data: any;
    let nodesUsedInTemplate: Set<string>;
    let nodesUsedInStyle: Set<string>;

    suiteSetup(() => {
      const { analyzeSetupScript, analyzeStyle, analyzeTemplate, parse } = require('vue-hook-optimizer');
      const code = readWorkspaceFile('basic.vue');
      const sfc = parse(code);

      data = analyzeSetupScript(
        sfc.descriptor.scriptSetup?.content || '',
        (sfc.descriptor.scriptSetup?.loc.start.line || 1) - 1,
        false,
      );

      nodesUsedInTemplate = sfc.descriptor.template?.content
        ? analyzeTemplate(sfc.descriptor.template!.content)
        : new Set<string>();

      nodesUsedInStyle = analyzeStyle(sfc.descriptor.styles || []);
    });

    test('graph should have nodes for ref, computed, and function', () => {
      const labels: string[] = Array.from(data.nodes).map((n: any) => n.label);
      assert.ok(labels.includes('count'), 'Should have count ref');
      assert.ok(labels.includes('doubled'), 'Should have doubled computed');
      assert.ok(labels.includes('increment'), 'Should have increment function');
    });

    test('should have edges between dependent nodes', () => {
      const edges = Array.from(data.edges.entries());
      assert.ok(edges.length > 0, 'Should have at least one edge');
    });

    test('should have nodes used in template', () => {
      assert.ok(nodesUsedInTemplate.has('count'), 'count should be used in template');
      assert.ok(nodesUsedInTemplate.has('doubled'), 'doubled should be used in template');
      assert.ok(nodesUsedInTemplate.has('increment'), 'increment should be used in template');
    });

    test('mermaid text should not be empty', () => {
      const { getMermaidText } = require('vue-hook-optimizer');
      const mermaid = getMermaidText(
        data,
        new Set([...nodesUsedInTemplate, ...nodesUsedInStyle]),
      );
      assert.ok(mermaid.length > 0, 'Mermaid text should not be empty');
      assert.ok(mermaid.startsWith('flowchart') || mermaid.startsWith('graph'), 'Mermaid should be a valid diagram');
    });

    test('suggestions should be generated', () => {
      const { gen } = require('vue-hook-optimizer');
      const suggests = gen(data, nodesUsedInTemplate, nodesUsedInStyle);
      assert.ok(Array.isArray(suggests), 'Suggestions should be an array');
    });

    test('vis data should have nodes and edges', () => {
      const { getVisData } = require('vue-hook-optimizer');
      const vis = getVisData(data, nodesUsedInTemplate, nodesUsedInStyle);
      assert.ok(vis.nodes && vis.nodes.length > 0, 'Vis data should have nodes');
      assert.ok(vis.edges && vis.edges.length > 0, 'Vis data should have edges');
    });
  });

  suite('TypeScript hooks (hooks.ts)', () => {
    let results: any[];

    suiteSetup(() => {
      const { analyzeHook } = require('vue-hook-optimizer');
      const code = readWorkspaceFile('hooks.ts');
      results = analyzeHook(code, 0, 'vue');
    });

    test('should detect both hooks', () => {
      assert.ok(results.length >= 2, `Should have at least 2 hooks, got ${results.length}`);
      const names = results.map((r: any) => r.hookName);
      assert.ok(names.includes('useCounter'), 'Should find useCounter');
      assert.ok(names.includes('useToggle'), 'Should find useToggle');
    });

    test('useCounter should have correct return nodes', () => {
      const counter = results.find((r: any) => r.hookName === 'useCounter');
      assert.ok(counter, 'useCounter should exist');
      assert.ok(counter.nodesUsedInReturn.has('count'), 'count should be in return');
      assert.ok(counter.nodesUsedInReturn.has('doubled'), 'doubled should be in return');
      assert.ok(counter.nodesUsedInReturn.has('increment'), 'increment should be in return');
      assert.ok(counter.nodesUsedInReturn.has('decrement'), 'decrement should be in return');
    });

    test('useToggle should have correct return nodes', () => {
      const toggle = results.find((r: any) => r.hookName === 'useToggle');
      assert.ok(toggle, 'useToggle should exist');
      assert.ok(toggle.nodesUsedInReturn.has('state'), 'state should be in return');
      assert.ok(toggle.nodesUsedInReturn.has('toggle'), 'toggle should be in return');
      assert.ok(toggle.nodesUsedInReturn.has('setTrue'), 'setTrue should be in return');
      assert.ok(toggle.nodesUsedInReturn.has('setFalse'), 'setFalse should be in return');
    });

    test('each hook should have mermaid text', () => {
      const { getMermaidText } = require('vue-hook-optimizer');
      for (const result of results) {
        const mermaid = getMermaidText(result.graph, result.nodesUsedInReturn);
        assert.ok(mermaid.length > 0, `${result.hookName} mermaid should not be empty`);
        assert.ok(mermaid.startsWith('flowchart') || mermaid.startsWith('graph'), `${result.hookName} mermaid should be a valid diagram`);
      }
    });

    test('each hook should have suggestions', () => {
      const { gen } = require('vue-hook-optimizer');
      for (const result of results) {
        const suggests = gen(result.graph, result.nodesUsedInReturn);
        assert.ok(Array.isArray(suggests), `${result.hookName} suggestions should be an array`);
      }
    });
  });

  suite('React JSX (component.jsx)', () => {
    let data: any;

    suiteSetup(() => {
      const { analyzeTsx } = require('vue-hook-optimizer');
      const code = readWorkspaceFile('component.jsx');
      data = analyzeTsx(code, 'react', 0);
    });

    test('should have graph nodes from React component', () => {
      const labels: string[] = Array.from(data.graph.nodes).map((n: any) => n.label);
      assert.ok(labels.includes('count'), 'Should have count state');
      assert.ok(labels.includes('setCount'), 'Should have setCount');
      assert.ok(labels.includes('doubled'), 'Should have doubled memo');
    });

    test('should have edges between state and derived values', () => {
      const edges = Array.from(data.graph.edges.entries());
      assert.ok(edges.length > 0, 'Should have at least one edge');
    });

    test('mermaid text should not be empty', () => {
      const { getMermaidText } = require('vue-hook-optimizer');
      const mermaid = getMermaidText(data.graph, data.nodesUsedInTemplate);
      assert.ok(mermaid.length > 0, 'Mermaid text should not be empty');
      assert.ok(mermaid.startsWith('flowchart') || mermaid.startsWith('graph'), 'Mermaid should be a valid diagram');
    });

    test('should have vis data', () => {
      const { getVisData } = require('vue-hook-optimizer');
      const vis = getVisData(data.graph, data.nodesUsedInTemplate);
      assert.ok(vis.nodes && vis.nodes.length > 0, 'Vis data should have nodes');
    });
  });

  suite('Multi-hook vis data (hooks.ts)', () => {
    let hooksWithVis: any[];

    suiteSetup(() => {
      const { analyzeHook, getVisData } = require('vue-hook-optimizer');
      const code = readWorkspaceFile('hooks.ts');
      const results = analyzeHook(code, 0, 'vue');
      hooksWithVis = results.map((r: any) => ({
        hookName: r.hookName,
        vis: getVisData(r.graph, r.nodesUsedInReturn, undefined, 'return'),
        mermaid: null,
        suggests: null,
      }));
    });

    test('should have vis data for each hook', () => {
      assert.ok(hooksWithVis.length >= 2, `Should have at least 2 hooks, got ${hooksWithVis.length}`);
      for (const hook of hooksWithVis) {
        assert.ok(hook.vis, `${hook.hookName} should have vis data`);
        assert.ok(Array.isArray(hook.vis.nodes), `${hook.hookName} vis should have nodes array`);
        assert.ok(Array.isArray(hook.vis.edges), `${hook.hookName} vis should have edges array`);
        assert.ok(hook.vis.nodes.length > 0, `${hook.hookName} vis should have at least one node`);
      }
    });

    test('useCounter vis should contain expected nodes', () => {
      const counter = hooksWithVis.find((h: any) => h.hookName === 'useCounter');
      assert.ok(counter, 'useCounter should exist');
      const nodeIds = counter.vis.nodes.map((n: any) => n.id);
      assert.ok(nodeIds.includes('count'), 'useCounter vis should have count node');
      assert.ok(nodeIds.includes('doubled'), 'useCounter vis should have doubled node');
      assert.ok(nodeIds.includes('increment'), 'useCounter vis should have increment node');
      assert.ok(nodeIds.includes('decrement'), 'useCounter vis should have decrement node');
    });

    test('useToggle vis should contain expected nodes', () => {
      const toggle = hooksWithVis.find((h: any) => h.hookName === 'useToggle');
      assert.ok(toggle, 'useToggle should exist');
      const nodeIds = toggle.vis.nodes.map((n: any) => n.id);
      assert.ok(nodeIds.includes('state'), 'useToggle vis should have state node');
      assert.ok(nodeIds.includes('toggle'), 'useToggle vis should have toggle node');
      assert.ok(nodeIds.includes('setTrue'), 'useToggle vis should have setTrue node');
      assert.ok(nodeIds.includes('setFalse'), 'useToggle vis should have setFalse node');
    });

    test('each hook vis should have edges', () => {
      for (const hook of hooksWithVis) {
        assert.ok(hook.vis.edges.length > 0, `${hook.hookName} should have edges`);
      }
    });

    test('hooks should have different node sets', () => {
      const counter = hooksWithVis.find((h: any) => h.hookName === 'useCounter');
      const toggle = hooksWithVis.find((h: any) => h.hookName === 'useToggle');
      assert.ok(counter && toggle, 'Both hooks should exist');

      const counterIds = new Set(counter.vis.nodes.map((n: any) => n.id));
      const toggleIds = new Set(toggle.vis.nodes.map((n: any) => n.id));

      // Both hooks have an 'initialValue' param, but their other nodes should be distinct
      assert.ok(counterIds.has('count'), 'useCounter should have its own count node');
      assert.ok(!toggleIds.has('count'), 'useToggle should not have count node');
      assert.ok(counterIds.has('increment'), 'useCounter should have increment');
      assert.ok(!toggleIds.has('increment'), 'useToggle should not have increment');
      assert.ok(toggleIds.has('state'), 'useToggle should have its own state node');
      assert.ok(!counterIds.has('state'), 'useCounter should not have state node');
      assert.ok(toggleIds.has('toggle'), 'useToggle should have toggle function');
      assert.ok(!counterIds.has('toggle'), 'useCounter should not have toggle function');
    });
  });
});
