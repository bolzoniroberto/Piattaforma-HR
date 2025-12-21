import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'node',
      setupFiles: ['./tests/server/setup.ts'],
      include: ['server/**/*.{test,spec}.ts', 'shared/**/*.{test,spec}.ts'],
      exclude: ['node_modules', 'dist'],
      globals: true,
    },
  })
);
