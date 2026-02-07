import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  minify: false,
  sourcemap: true,
  dts: true,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
