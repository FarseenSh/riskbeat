import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import riskbeat from "./eslint-rules/no-cross-feed-render.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // CHARTER.md §2 enforcement, layer 3: no expression may combine two
    // feeds' rating values. See eslint-rules/no-cross-feed-render.js.
    plugins: { riskbeat },
    rules: { "riskbeat/no-cross-feed-render": "error" },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "lib/generated/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
