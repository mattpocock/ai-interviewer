// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import signatureDesignPlugin from "eslint-plugin-signature-design";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.react-router/**",
      "**/drizzle/**",
    ],
  },
  // React rules for tsx files
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React recommended rules
      ...reactPlugin.configs.recommended.rules,
      // React hooks rules
      ...reactHooksPlugin.configs.recommended.rules,
      // React 19 uses the new JSX transform, no need to import React
      "react/react-in-jsx-scope": "off",
      // Allow JSX in .tsx files
      "react/jsx-filename-extension": [
        "error",
        { extensions: [".tsx", ".jsx"] },
      ],
    },
  },
  // General rules for all files
  {
    plugins: {
      "signature-design": signatureDesignPlugin,
    },
    rules: {
      // Allow unused vars that start with underscore
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Prevent multiple positional parameters of the same type
      // This catches cases like (id: string, userId: string) where args can be confused
      // Set to "warn" until existing code is refactored to use named object parameters
      "signature-design/max-duplicate-param-types": [
        "warn",
        { maxOfSameType: 1 },
      ],
    },
  }
);
