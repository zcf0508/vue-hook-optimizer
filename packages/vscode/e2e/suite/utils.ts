import * as path from 'node:path';
import * as vscode from 'vscode';

// Singleton document to be used across tests
let openDoc: vscode.TextDocument;

const workspacePath = path.join(__dirname, '../../workspace');

/**
 * Opens a document in the test workspace.
 * Sets the shared `openDoc` variable to the opened document.
 */
export async function openDocument(fileName: string): Promise<void> {
  const uri = vscode.Uri.file(path.join(workspacePath, fileName));
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
  openDoc = doc;
}

/**
 * Executes the vho analyze command on the currently active editor.
 * Returns after the command has completed (or throws if it fails).
 */
export async function executeAnalyze(): Promise<void> {
  await vscode.commands.executeCommand('vho.action.analyze');
}

/**
 * Waits for a tab with a title matching the given pattern to appear.
 * Returns the tab input if found, or null if timeout is reached.
 */
export async function waitForTabWithTitle(
  titlePattern: string | RegExp,
  timeoutMs: number = 15000,
): Promise<vscode.Tab | null> {
  const startTime = Date.now();
  const pattern = typeof titlePattern === 'string'
    ? new RegExp(titlePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    : titlePattern;

  while (Date.now() - startTime < timeoutMs) {
    const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
    const match = tabs.find(tab => pattern.test(tab.label));
    if (match) {
      return match;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return null;
}

/**
 * Gets the currently opened document.
 */
export function getDocument(): vscode.TextDocument {
  return openDoc;
}

/**
 * Asserts that a value is truthy, with a descriptive message.
 */
export function assertOk(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(`Assertion failed: ${message}`);
  }
}