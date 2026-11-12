import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // import 방향: app → features → domains → shared (아래 계층이 위 계층을 가져오지 않는다)
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/shared",
              from: ["./src/domains", "./src/features", "./src/app"],
              message: "shared 는 domains · features · app 을 가져오지 않는다.",
            },
            {
              target: "./src/domains",
              from: ["./src/features", "./src/app"],
              message: "domains 는 features · app 을 가져오지 않는다.",
            },
            {
              target: "./src/features",
              from: "./src/app",
              message: "features 는 app 을 가져오지 않는다 — 공통은 shared 로 옮긴다.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
