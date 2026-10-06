import nkzw from "@nkzw/oxlint-config";
import { defineConfig } from "oxlint";

export default defineConfig({
  env: {
    browser: true,
    builtin: true,
    es2024: true,
  },
  extends: [nkzw],
  globals: {
    Chart: "readonly", // loaded from a CDN <script> tag
  },
  overrides: [
    {
      env: {
        browser: false,
        node: true,
      },
      files: ["middleware/**"],
      rules: {
        "no-console": "off", // middleware request/error logging goes to stdout/stderr
      },
    },
  ],
  rules: {
    "no-console": ["error", { allow: ["error", "warn"] }],
    "perfectionist/sort-objects": "off", // key order drives some logic
    "unicorn/numeric-separators-style": [
      "error",
      { hexadecimal: { onlyIfContainsSeparator: true } }, // "0x00ff", not "0x00_ff"
    ],
  },
});
