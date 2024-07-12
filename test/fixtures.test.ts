import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import fg from 'fast-glob';
import { analyzeOptions, analyzeSetupScript, analyzeStyle, analyzeTemplate, analyzeTsx, parse } from '@/index';

describe('fixtures', async () => {
  const frameworks = ['vue', 'react'] as const;
  for (const framework of frameworks) {
    const tests = await fg(`./fixtures/${framework}/**/*`);
    for (const test of tests) {
      const testName = `${framework}/${basename(test)}`;
      it(testName, async () => {
        const source = readFileSync(test, 'utf-8');
        if (framework === 'vue') {
          const sfc = parse(source);

          const nodesUsedInStyle = analyzeStyle(sfc.descriptor.styles || []);

          if (test.includes('tsx')) {
            const { graph, nodesUsedInTemplate } = analyzeTsx(
              sfc.descriptor.script?.content || '',
              'vue',
              (sfc.descriptor.script?.loc.start.line || 1) - 1,
            );

            await expect(graph)
              .toMatchFileSnapshot(`./output/${testName}.graph.txt`);

            const nodes = sfc.descriptor.template?.content
              ? analyzeTemplate(sfc.descriptor.template!.content)
              : new Set<string>();

            await expect(new Set([...nodesUsedInStyle, ...nodesUsedInTemplate, ...nodes]))
              .toMatchFileSnapshot(`./output/${testName}.nodes.txt`);
          }
          else if (sfc.descriptor.scriptSetup?.content) {
            const graph = analyzeSetupScript(
              sfc.descriptor.scriptSetup?.content || '',
              (sfc.descriptor.scriptSetup?.loc.start.line || 1) - 1,
            );
            await expect(graph)
              .toMatchFileSnapshot(`./output/${testName}.graph.txt`);

            const nodes = sfc.descriptor.template?.content
              ? analyzeTemplate(sfc.descriptor.template!.content)
              : new Set<string>();
            await expect(new Set([...nodesUsedInStyle, ...nodes]))
              .toMatchFileSnapshot(`./output/${testName}.nodes.txt`);
          }
          else {
            const { graph, nodesUsedInTemplate } = analyzeOptions(
              sfc.descriptor.script?.content || '',
              (sfc.descriptor.script?.loc.start.line || 1) - 1,
              true,
            );
            await expect(graph)
              .toMatchFileSnapshot(`./output/${testName}.graph.txt`);

            const nodes = sfc.descriptor.template?.content
              ? analyzeTemplate(sfc.descriptor.template!.content)
              : new Set<string>();

            await expect(new Set([...nodesUsedInStyle, ...nodesUsedInTemplate, ...nodes]))
              .toMatchFileSnapshot(`./output/${testName}.nodes.txt`);
          }
        }
        if (framework === 'react') {
          const { graph, nodesUsedInTemplate } = analyzeTsx(
            source,
            'react',
            0,
          );
          await expect(graph)
            .toMatchFileSnapshot(`./output/${testName}.graph.txt`);

          await expect(nodesUsedInTemplate)
            .toMatchFileSnapshot(`./output/${testName}.nodes.txt`);
        }
      });
    }
  }
});
