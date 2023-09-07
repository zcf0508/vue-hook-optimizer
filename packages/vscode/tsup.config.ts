import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'script/index.ts',
  ],
  format: ['cjs'],
  shims: false,
  dts: false,
  external: [
    'vscode',
  ],
});