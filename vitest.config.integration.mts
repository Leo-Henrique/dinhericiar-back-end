import { mergeConfig } from "vitest/config";
import defaultConfig from "./vitest.config.mjs";

export default mergeConfig(defaultConfig, {
  test: {
    include: ["./src/infra/**/*.spec.ts"],
    setupFiles: ["./test/integration/setup.ts"],
  },
});
