import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    // Tests are mock-only: never call live 1Click from the test suite.
    environment: 'node',
    testTimeout: 15_000,
  },
})
