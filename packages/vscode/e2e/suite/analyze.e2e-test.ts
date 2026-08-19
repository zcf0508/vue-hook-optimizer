import * as assert from 'node:assert';
import { executeAnalyze, openDocument, waitForTabWithTitle } from './utils';

suite('Analyze Command', () => {
  suite('Vue component', () => {
    test('analyze on basic Vue SFC should succeed', async () => {
      await openDocument('basic.vue');

      // Execute analyze - should not throw
      await executeAnalyze();

      // A webview panel should open with the file name in the title
      const tab = await waitForTabWithTitle('basic.vue', 10000);
      assert.ok(tab, 'Should open a webview tab with the file name in the title');
    });
  });

  suite('TypeScript hooks file', () => {
    test('analyze on hooks file should succeed', async () => {
      await openDocument('hooks.ts');

      await executeAnalyze();

      const tab = await waitForTabWithTitle('hooks.ts', 10000);
      assert.ok(tab, 'Should open a webview tab for hooks analysis');
    });
  });

  suite('React JSX component', () => {
    test('analyze on React component should succeed', async () => {
      await openDocument('component.jsx');

      await executeAnalyze();

      const tab = await waitForTabWithTitle('component.jsx', 10000);
      assert.ok(tab, 'Should open a webview tab for React component analysis');
    });
  });
});