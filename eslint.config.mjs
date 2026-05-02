import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "webdeploy/**",
      "app-logs/**",
      "app-logs2/**",
      "app-logs3/**",
      "azure-functions/dist/**",
      "azure-functions/lib/**/*.js",
      "lib/**/*.js",
      "types/**/*.js",
      "**/*.d.ts",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "prefer-const": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/purity": "off",
    },
  },
];
