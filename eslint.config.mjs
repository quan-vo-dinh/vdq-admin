import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Android uses local static images, with no Next image optimizer runtime.
  { files: ['mobile/**/*.tsx'], rules: { '@next/next/no-img-element': 'off' } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "mobile/dist/**",
    "mobile/preview/**",
    "mobile/android/**",
  ]),
]);

export default eslintConfig;
