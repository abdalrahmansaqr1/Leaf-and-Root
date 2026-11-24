import { defineConfig } from "vitest/config";
import { resolveTestDatabaseUrl } from "./src/test/test-database.js";

export default defineConfig({
  test: {
    include: ["src/**/*.e2e-spec.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    globalSetup: ["./src/test/global-setup.ts"],
    // Applied before any test module loads, so the app can only ever see the isolated database.
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      DATABASE_URL: resolveTestDatabaseUrl(),
      CORS_ALLOWED_ORIGINS: "http://localhost:8443",
      SWAGGER_ENABLED: "true",
    },
  },
});
