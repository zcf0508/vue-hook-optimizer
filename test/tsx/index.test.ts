import * as fs from 'node:fs';
import path from 'node:path';
import { parse, analyzeTemplate, analyzeTsx } from '@/index';

import {graph as graphRes} from './TestComponent.graph';
import {nodes as nodesRes} from './TestComponent.nodes';

describe('test analyze', () => {
  const source = fs.readFileSync(path.resolve(__dirname, './TestComponent.vue'), 'utf-8');
  const sfc = parse(source);
  it('test analyze tsx setup', async () => {
    const { graph, nodesUsedInTemplate } = await analyzeTsx(sfc.descriptor.script?.content!);
    expect(graph).toEqual(graphRes);
    expect(nodesUsedInTemplate).toEqual(nodesRes);
  });
});