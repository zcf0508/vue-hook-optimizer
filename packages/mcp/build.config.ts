import path from 'node:path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  declaration: false,
  clean: true,
  alias: {
    'vue-hook-optimizer': path.resolve(__dirname, '../../packages/core/src'),
  },
  rollup: {
    dts: {
      respectExternal: true,
    },
  },
  failOnWarn: false,
});
