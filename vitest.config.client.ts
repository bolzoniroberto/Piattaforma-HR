import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';
import react from '@vitejs/plugin-react';

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/client/setup.ts'],
      include: ['client/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist'],
      globals: true,
    },
  })
);
