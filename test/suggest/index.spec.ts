import { readFileSync } from 'node:fs';
import { analyzeSetupScript, analyzeStyle, analyzeTemplate, gen, parse } from '@/index';

const testFile = './fixtures/vue/setup-block.vue';

describe('suggest gen', () => {
  const source = readFileSync(testFile, 'utf-8');
  const sfc = parse(source);
  it('base', () => {
    const graph = analyzeSetupScript(
      sfc.descriptor.scriptSetup?.content || '',
      (sfc.descriptor.scriptSetup?.loc.start.line || 1) - 1,
    );

    const nodesUsedInStyle = analyzeStyle(sfc.descriptor.styles || []);

    const nodesUsedInTemplate = sfc.descriptor.template?.content
      ? analyzeTemplate(sfc.descriptor.template!.content)
      : new Set<string>();

    expect(gen(graph, nodesUsedInTemplate, nodesUsedInStyle)).toMatchFileSnapshot('../output/suggent-gen.txt');
  });
});
