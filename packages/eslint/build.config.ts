import path from 'node:path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: true,
  clean: true,
  alias: {
    'vue-hook-optimizer': path.resolve(__dirname, '../../src'),
  },
  rollup: {
    emitCJS: true,
  },
  externals: [
    '@typescript-eslint/utils',
  ],
  failOnWarn: false,
});
