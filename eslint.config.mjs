import defaultConfig from "@forsakringskassan/eslint-config";
import cliConfig from "@forsakringskassan/eslint-config-cli";
import typescriptConfig from "@forsakringskassan/eslint-config-typescript";
import typeinfoConfig from "@forsakringskassan/eslint-config-typescript-typeinfo";
import vitestConfig from "@forsakringskassan/eslint-config-vitest";

export default [
    {
        name: "Ignored files",
        ignores: [
            "**/coverage/**",
            "**/dist/**",
            "**/node_modules/**",
            "**/public/**",
            "**/temp/**",
            "**/typedoc/**",
        ],
    },

    ...defaultConfig,

    cliConfig({
        files: ["**/*.mjs", "**/*.ts"],
    }),
    typescriptConfig(),
    typeinfoConfig(import.meta.dirname),
    vitestConfig(),
];
