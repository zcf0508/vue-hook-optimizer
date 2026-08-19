import * as assert from 'node:assert';
import * as vscode from 'vscode';

suite('Extension Activation', () => {
  test('extension should be present', () => {
    const extension = vscode.extensions.getExtension('zcf0508.vue-hook-optimizer-ext');
    assert.ok(extension, 'Extension should be installed');
  });

  test('extension should be activated', async () => {
    const extension = vscode.extensions.getExtension('zcf0508.vue-hook-optimizer-ext');
    assert.ok(extension, 'Extension should be installed');

    if (!extension.isActive) {
      await extension.activate();
    }

    assert.ok(extension.isActive, 'Extension should be active');
  });

  test('analyze command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('vho.action.analyze'),
      'vho.action.analyze command should be registered',
    );
  });

  test('toggleColors command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('vho.community.toggleColors'),
      'vho.community.toggleColors command should be registered',
    );
  });
});