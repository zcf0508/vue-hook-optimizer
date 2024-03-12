import * as fs from 'node:fs';
import path from 'node:path';
import { parse, analyzeTemplate, analyzeTsx } from '@/index';

import {graph as graphRes} from './TestComponent.graph';
import {graph as graphRes2} from './TestComponent.graph2';
import {graph as graphRes3} from './TestComponent.graph3';
import {graph as graphRes4} from './TestComponent.graph4';
import {nodes as nodesRes} from './TestComponent.nodes';
import {nodes as nodesRes2} from './TestComponent.nodes2';
import {nodes as nodesRes3} from './TestComponent.nodes3';
import {nodes as nodesRes4} from './TestComponent.nodes4';

describe('test vue analyze', () => {
  const source = fs.readFileSync(path.resolve(__dirname, './TestComponent.vue'), 'utf-8');
  const source2 = fs.readFileSync(path.resolve(__dirname, './TestComponent2.vue'), 'utf-8');
  const sfc = parse(source);
  const sfc2 = parse(source2);
  
  it('test analyze tsx setup', () => {
    const { graph, nodesUsedInTemplate } = analyzeTsx(
      sfc.descriptor.script?.content!, 
      'vue',
      (sfc.descriptor.script?.loc.start.line || 1) - 1,
      false
    );

    expect(graph).toEqual(graphRes);
    expect(nodesUsedInTemplate).toEqual(nodesRes);  
  });

  it('test analyze tsx setup not jsx', () => {
    const { graph } = analyzeTsx(
      sfc2.descriptor.script?.content!, 
      'vue',
      (sfc2.descriptor.script?.loc.start.line || 1) - 1,
      false
    );

    expect(graph).toEqual(graphRes2);
  });
});

describe('test react analyze', () => {
  const source = fs.readFileSync(path.resolve(__dirname, './TestComponent3.jsx'), 'utf-8');
  const source2 = fs.readFileSync(path.resolve(__dirname, './TestComponent4.jsx'), 'utf-8');

  it('test analyze react jsx class', () => {
    const { graph, nodesUsedInTemplate } = analyzeTsx(
      source, 
      'react',
      0,
      false
    );
    expect(graph).toEqual(graphRes3);
    expect(nodesUsedInTemplate).toEqual(nodesRes3);  
  });
  it('test analyze react jsx function', () => {
    const { graph, nodesUsedInTemplate } = analyzeTsx(
      source2, 
      'react',
      0,
      false
    );
    expect(graph).toEqual(graphRes4);
    expect(nodesUsedInTemplate).toEqual(nodesRes4);  
  });
});
