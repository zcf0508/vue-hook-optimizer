import * as path from 'node:path';
import { glob } from 'glob';
import Mocha from 'mocha';

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 60000,
  });

  const testsRoot = path.resolve(__dirname);

  const files = await glob('**/*.e2e-test.js', { cwd: testsRoot });

  files.forEach(file => mocha.addFile(path.resolve(testsRoot, file)));

  return new Promise<void>((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      }
      else {
        resolve();
      }
    });
  });
}
