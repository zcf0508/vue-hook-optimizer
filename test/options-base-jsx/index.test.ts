import * as fs from 'node:fs';
import path from 'node:path';
import { parse, analyzeTemplate, analyzeOptions } from '@/index';

import {graph as graphRes} from './TestComponent.graph';
import {nodes as nodesRes} from './TestComponent.nodes';

describe('test analyze', () => {
  const source = fs.readFileSync(path.resolve(__dirname, './TestComponent.vue'), 'utf-8');
  const sfc = parse(source);
  it('test analyze options base', () => {
    const {graph, nodesUsedInTemplate} = analyzeOptions(
      sfc.descriptor.script?.content!, 
      (sfc.descriptor.script?.loc.start.line || 1) - 1,
      true,
    );
    expect(graph).toEqual(graphRes);
    expect(nodesUsedInTemplate).toEqual(nodesRes);
  });

});
