import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    // 대상은 모두 순수 함수라서 jsdom이나 React 렌더링 환경이 필요 없습니다.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
