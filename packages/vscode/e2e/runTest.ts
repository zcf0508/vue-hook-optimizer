import * as cp from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';

function findSystemVSCode(): string | null {
  const candidates = [
    '/Applications/Visual Studio Code.app/Contents/MacOS/Electron',
    '/Applications/Visual Studio Code.app/Contents/MacOS/Code',
    '/Applications/Visual Studio Code - Insiders.app/Contents/MacOS/Electron',
    '/Applications/Visual Studio Code - Insiders.app/Contents/MacOS/Code',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Some VS Code builds (especially downloaded test versions) use `Code` as the
 * binary name instead of `Electron`. Try both.
 */
function resolveExecutablePath(basePath: string): string {
  if (fs.existsSync(basePath)) {
    return basePath;
  }

  // Try replacing 'Electron' with 'Code' in the path
  const alt = basePath.replace(/\/Electron$/, '/Code');
  if (fs.existsSync(alt)) {
    return alt;
  }

  // If the path ends with 'Code', try 'Electron'
  const alt2 = basePath.replace(/\/Code$/, '/Electron');
  if (fs.existsSync(alt2)) {
    return alt2;
  }

  return basePath;
}

async function main() {
  // __dirname is e2e/out/ in compiled output
  const extensionDevelopmentPath = path.resolve(__dirname, '../../');
  const extensionTestsPath = path.resolve(__dirname, './suite/index');
  const workspaceFolder = path.resolve(__dirname, '../workspace');

  // Prefer system VS Code on macOS to avoid quarantine issues with downloaded builds
  // On other platforms, download the test version
  let vscodeExecutablePath = process.env.VSCODE_PATH || '';

  if (!vscodeExecutablePath) {
    const system = findSystemVSCode();
    if (system) {
      console.log('Using system VS Code:', system);
      vscodeExecutablePath = system;
    }
    else {
      console.log('Downloading VS Code for testing...');
      vscodeExecutablePath = await downloadAndUnzipVSCode('stable');
      vscodeExecutablePath = resolveExecutablePath(vscodeExecutablePath);
      console.log('VS Code executable:', vscodeExecutablePath);
    }
  }

  const args = [
    // https://github.com/microsoft/vscode/issues/84238
    '--no-sandbox',
    // https://github.com/microsoft/vscode-test/issues/221
    '--disable-gpu-sandbox',
    // https://github.com/microsoft/vscode-test/issues/120
    '--disable-updates',
    '--skip-welcome',
    '--skip-release-notes',
    '--disable-workspace-trust',
    `--extensionDevelopmentPath=${extensionDevelopmentPath}`,
    `--extensionTestsPath=${extensionTestsPath}`,
    workspaceFolder,
  ];

  console.log('Starting VS Code extension tests...');
  console.log('Executable:', vscodeExecutablePath);

  const proc = cp.spawn(vscodeExecutablePath, args, {
    env: { ...process.env },
    stdio: 'inherit',
  });

  return new Promise<void>((resolve, reject) => {
    proc.on('close', (code) => {
      if (code === 0) {
        console.log('Tests passed!');
        resolve();
      }
      else {
        reject(new Error(`Test run failed with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

main().catch((err) => {
  console.error('Failed to run tests:', err);
  process.exit(1);
});
