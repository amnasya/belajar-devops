import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Postgres untuk test: container `dt-test-pg` di port 5433 (lihat docs/steps/01-aplikasi.md)
    env: {
      DB_HOST: process.env.DB_HOST ?? 'localhost',
      DB_PORT: process.env.DB_PORT ?? '5433',
      DB_USER: process.env.DB_USER ?? 'postgres',
      DB_PASSWORD: process.env.DB_PASSWORD ?? 'test',
      DB_NAME: process.env.DB_NAME ?? 'tasks_test',
    },
  },
});
