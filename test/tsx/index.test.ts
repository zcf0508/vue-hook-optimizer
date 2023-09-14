import * as fs from 'node:fs';
import path from 'node:path';
import { parse, analyzeTemplate, analyzeTsx } from '@/index';

import {graph as graphRes} from './TestComponent.graph';
import {graph as graphRes2} from './TestComponent.graph2';
import {nodes as nodesRes} from './TestComponent.nodes';
import {nodes as nodesRes2} from './TestComponent.nodes2';

describe('test analyze', () => {
  const source = fs.readFileSync(path.resolve(__dirname, './TestComponent.vue'), 'utf-8');
  const source2 = fs.readFileSync(path.resolve(__dirname, './TestComponent2.vue'), 'utf-8');
  const sfc = parse(source);
  const sfc2 = parse(source2);
  it('test analyze tsx setup', async () => {
    const { graph, nodesUsedInTemplate } = await analyzeTsx(
      sfc.descriptor.script?.content!, 
      (sfc.descriptor.script?.loc.start.line || 1) - 1,
      false
    );

    expect(graph).toEqual(graphRes);
    expect(nodesUsedInTemplate).toEqual(nodesRes);  
  });

  it('test analyze tsx setup not jsx', async () => {
    const { graph } = await analyzeTsx(
      sfc2.descriptor.script?.content!, 
      (sfc2.descriptor.script?.loc.start.line || 1) - 1,
      false
    );

    expect(graph).toEqual(graphRes2);
  });
});