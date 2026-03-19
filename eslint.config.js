import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "build/**",
      "coverage/**",
      "dist/**",
      "docs/.vitepress/**",
      "node_modules/**",
      "packages/*/dist/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      "packages/**/*.ts",
      "packages/**/*.tsx",
      "example/**/*.ts",
      "example/**/*.tsx",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    files: [
      "example/**/*.ts",
      "example/**/*.tsx",
      "packages/**/*.test.ts",
      "packages/**/*.test.tsx",
      "packages/**/__tests__/**/*.ts",
      "packages/**/__tests__/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
