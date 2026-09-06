import { defineConfig } from "vite-plus";
export default defineConfig({
  test: { include: ["backend/src/**/*.test.ts", "frontend/src/**/*.test.ts"], environment: "node" },
  lint: {
    plugins: ["typescript", "react", "jsx-a11y", "import", "unicorn", "oxc"],
    overrides: [
      {
        files: ["frontend/src/**/*.ts", "frontend/src/**/*.tsx"],
        rules: { "react/rules-of-hooks": "error", "react/exhaustive-deps": "warn" },
      },
    ],
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: [
      "**/generated/**",
      "**/build/**",
      "**/dist/**",
      "**/node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  fmt: {
    ignorePatterns: [
      "**/generated/**",
      "pnpm-lock.yaml",
      "**/build/**",
      "**/dist/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
});
