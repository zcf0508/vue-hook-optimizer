import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return {
    entry: [
      'src/index.ts',
    ],
    sourcemap: options.env?.NODE_ENV === 'development',
    format: ['cjs'],
    shims: false,
    dts: false,
    external: [
      'vscode',
    ],
  };
});
