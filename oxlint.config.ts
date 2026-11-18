import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import drizzle from "ultracite/oxlint/drizzle";
import { jsPluginSettings, selectJsPlugins } from "ultracite/oxlint/js-plugins";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import tanstack from "ultracite/oxlint/tanstack";
import tanstackJsPlugins from "ultracite/oxlint/tanstack/js-plugins";
import vitest from "ultracite/oxlint/vitest";

const jsPlugins = selectJsPlugins(["sonarjs", "react-doctor"]);

/**
 * Architecture boundaries. Each layer may only import what it is allowed to.
 * - shared/domain is pure: no client, no worker, no framework code.
 * - the client may only import worker *types* (Hono RPC AppType) through src/client/lib/api.ts.
 * - the worker never imports client code.
 */
const sharedBoundary = {
  patterns: [
    {
      group: [
        "**/client/**",
        "**/worker/**",
        "react",
        "react-dom",
        "hono",
        "drizzle-orm*",
      ],
      message:
        "shared/domain must stay pure: no client, worker or framework imports.",
    },
  ],
};

const clientBoundary = {
  patterns: [
    {
      group: [
        "**/worker/**",
        "drizzle-orm*",
        "hono",
        "hono/*",
        "!hono/client",
        "aws4fetch",
        "@simplewebauthn/server",
      ],
      message:
        "Client code must not import worker/server code. Use the typed API client in src/client/lib/api.ts.",
    },
  ],
};

const workerBoundary = {
  patterns: [
    {
      group: [
        "**/client/**",
        "react",
        "react-dom",
        "@tanstack/*",
        "@simplewebauthn/browser",
      ],
      message: "Worker code must not import client code or browser libraries.",
    },
  ],
};

export default defineConfig({
  env: core.env,
  extends: [
    core,
    react,
    tanstack,
    vitest,
    drizzle,
    jsPlugins,
    tanstackJsPlugins,
    shadcn,
    antiSlop,
  ],
  ignorePatterns: [
    ...core.ignorePatterns,
    "src/client/routeTree.gen.ts",
    "src/worker/worker-configuration.d.ts",
    "src/client/components/ui/**",
    "migrations/**",
    "dev-dist/**",
    // Local-only developer scripts, not shipped with the app.
    "scripts/**",
  ],
  jsPlugins: [...jsPlugins.jsPlugins, ...shadcn.jsPlugins],
  options: { typeAware: true },
  settings: jsPluginSettings,
  rules: {
    // Keep files, functions and control flow small enough to review.
    "max-lines": [
      "error",
      { max: 300, skipBlankLines: true, skipComments: true },
    ],
    "max-lines-per-function": [
      "error",
      { max: 120, skipBlankLines: true, skipComments: true },
    ],
    "max-depth": ["error", 4],
    "max-params": ["error", 4],
    complexity: ["error", 15],
    // Hono middleware calls `await next()`; this rule targets Node-style callbacks.
    "node/callback-return": "off",
    // React components are PascalCase; everything else camelCase.
    "sonarjs/function-name": [
      "error",
      { format: "^(?:[_a-z][a-zA-Z0-9]*|[A-Z][a-zA-Z0-9]*)$" },
    ],
    // `void promise;` marks an intentionally detached promise (e.g. form.handleSubmit()).
    "no-void": ["error", { allowAsStatement: true }],
    // React event handlers may be async; their promise is intentionally not awaited by React.
    "typescript/no-misused-promises": [
      "error",
      { checksVoidReturn: { attributes: false } },
    ],
    // Logging goes through explicit warn/error only.
    "no-console": ["error", { allow: ["warn", "error"] }],
  },
  overrides: [
    {
      files: ["src/shared/**"],
      rules: { "no-restricted-imports": ["error", sharedBoundary] },
    },
    {
      files: ["src/client/**"],
      rules: { "no-restricted-imports": ["error", clientBoundary] },
    },
    {
      files: ["src/client/lib/api.ts"],
      rules: { "no-restricted-imports": "off" },
    },
    {
      files: ["src/worker/**"],
      rules: { "no-restricted-imports": ["error", workerBoundary] },
    },
    {
      // TanStack Router redirects are thrown by design: `throw redirect({ to })`.
      files: ["src/client/routes/**"],
      rules: { "typescript/only-throw-error": "off" },
    },
    {
      // JSX handlers return promises on purpose (see no-misused-promises above).
      files: ["**/*.tsx"],
      rules: {
        "typescript/strict-void-return": "off",
        // TanStack Form's documented pattern is `render: function SectionRender({ form })`
        // (a named, capitalised function so hooks are allowed inside it).
        "func-name-matching": "off",
      },
    },
    {
      // These files ARE the I/O boundary: they receive untyped errors, JSON and push payloads
      // and turn them into typed values, so `unknown` inputs and `typeof` narrowing belong here.
      files: [
        "src/client/lib/api.ts",
        "src/client/lib/errors.ts",
        "src/client/lib/passkeys.ts",
        "src/client/components/form/field-errors.tsx",
        "src/client/modules/auth/use-passkey-error.ts",
        "src/client/sw.ts",
      ],
      rules: {
        "anti-slop/no-runtime-typeof": "off",
        "anti-slop/no-unknown-parameters": "off",
        "anti-slop/no-unknown-returns": "off",
      },
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx"],
      rules: { "max-lines-per-function": "off", "max-lines": "off" },
    },
  ],
});
