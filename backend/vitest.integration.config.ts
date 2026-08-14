import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./tests/integration/global-setup.ts'],
    setupFiles: ['./tests/setup.ts', './tests/integration/setup.ts'],
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
