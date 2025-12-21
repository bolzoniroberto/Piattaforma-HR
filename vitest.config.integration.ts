import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'node',
      setupFiles: ['./tests/integration/setup.ts'],
      include: ['tests/integration/**/*.{test,spec}.ts'],
      testTimeout: 30000,
      hookTimeout: 30000,
      globals: true,
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true, // Use single fork for DB tests to avoid conflicts
        },
      },
    },
  })
);
