import * as fs from 'node:fs';
import path from 'node:path';

import { graph as graphRes } from './TestComponent.graph';
import { nodes as nodesRes } from './TestComponent.nodes';
import { analyzeOptions, analyzeStyle, analyzeTemplate, parse } from '@/index';

describe('test analyze', () => {
  const source = fs.readFileSync(path.resolve(__dirname, './TestComponent.vue'), 'utf-8');
  const sfc = parse(source);
  it('test analyze options setup', () => {
    const { graph } = analyzeOptions(
      sfc.descriptor.script?.content || '',
      (sfc.descriptor.script?.loc.start.line || 1) - 1,
      true,
    );
    expect(graph).toEqual(graphRes);
  });
  it('test analyze template', () => {
    const nodes = analyzeTemplate(sfc.descriptor.template!.content);
    expect(nodes).toEqual(nodesRes);
  });
  it('test analyze style', () => {
    const nodes = analyzeStyle(sfc.descriptor.styles);
    expect(nodes).toMatchInlineSnapshot(`
      Set {
        "count",
      }
    `);
  });
});
