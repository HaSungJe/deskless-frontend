import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // import 방향: app → contracts → shared (아래 계층이 위 계층을 가져오지 않는다)
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/shared",
              from: ["./src/contracts", "./src/app"],
              message: "shared 는 contracts · app 을 가져오지 않는다.",
            },
            {
              target: "./src/contracts",
              from: "./src/app",
              message: "contracts 는 app 을 가져오지 않는다 — 여러 화면이 쓰면 shared 로 옮긴다.",
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
