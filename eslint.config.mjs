import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
    plugins: ["simple-import-sort", "prettier", "@typescript-eslint"],
    parser: "@typescript-eslint/parser",
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "prettier/prettier": [
        "error",
        {},
        {
          usePrettierrc: true,
        },
      ],
      semi: ["error"],
      quotes: ["error", "double"],
      "no-console": ["warn"],
      "no-unused-vars": ["error"],
      "no-undef": ["error"],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
    ignorePatterns: ["node_modules", "/server.js", ".next", "out", "build"],
  }),
];

export default eslintConfig;
