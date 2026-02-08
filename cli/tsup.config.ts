import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

// Recursively copy directory
function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

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
  onSuccess: async () => {
    // Copy Handlebars templates to dist
    copyDir('src/lib/templates/handlebars', 'dist/handlebars');
    console.log('✓ Copied Handlebars templates to dist/');
  },
});
