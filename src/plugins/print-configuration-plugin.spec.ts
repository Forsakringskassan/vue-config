import { Console } from "node:console";
import { stripVTControlCharacters } from "node:util";
import prettyAnsi from "pretty-ansi";
import { WritableStreamBuffer } from "stream-buffers";
import { beforeEach, expect, it, vi } from "vitest";
import { printConfiguration } from "./print-configuration-plugin";

expect.addSnapshotSerializer({
    test(value) {
        return typeof value === "string";
    },
    serialize: String,
});

vi.mock(import("node:util"), async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        default: {
            ...original.default,
            styleText(fmt, text, options) {
                return original.styleText(fmt, text, {
                    validateStream: false,
                    ...options,
                });
            },
        },
    };
});

vi.mock(import("vue"), async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        version: "1.2.3",
    };
});

const pkg = { name: "mock-package", version: "1.2.3" };
let stream: WritableStreamBuffer;
let mockConsole: Console;

function getOutput({ color }: { color: boolean }): string {
    const fn = color ? prettyAnsi : stripVTControlCharacters;
    const content = stream.getContentsAsString("utf8") || "";
    return fn(content)
        .split("\n")
        .map((it) => it.replace(/\s+$/, ""))
        .join("\n");
}

beforeEach(() => {
    stream = new WritableStreamBuffer();
    mockConsole = new Console(stream, stream);
});

it("should print basic information", () => {
    expect.assertions(1);
    printConfiguration(mockConsole, pkg, {
        proxySettings: {},
        useProxy: false,
        mode: "development",
        sourceMaps: false,
        userConfigured: null,
    });
    expect(getOutput({ color: true })).toMatchInlineSnapshot(`
      <green><bold>Vue configuration</intensity></color>
          - Default configuration from mock-package@1.2.3

          <bold>Vue version:</intensity> 1.2.3
          Mode: development
          <bold>Sourcemaps:</intensity> <red>disabled</color> (use "--source-maps" to enable)
    `);
});

it("should print when user has reconfigured vite", () => {
    expect.assertions(1);
    printConfiguration(mockConsole, pkg, {
        proxySettings: {},
        useProxy: false,
        mode: "development",
        sourceMaps: false,
        userConfigured: "print-configuration.spec.ts",
    });
    expect(getOutput({ color: true })).toMatchInlineSnapshot(`
      <green><bold>Vue configuration</intensity></color>
          - Default configuration from mock-package@1.2.3
          - Overwritten from application "print-configuration.spec.ts"

          <bold>Vue version:</intensity> 1.2.3
          Mode: development
          <bold>Sourcemaps:</intensity> <red>disabled</color> (use "--source-maps" to enable)
    `);
});

it("should print custom mode", () => {
    expect.assertions(1);
    printConfiguration(mockConsole, pkg, {
        proxySettings: {},
        useProxy: false,
        mode: "foobar",
        sourceMaps: false,
        userConfigured: null,
    });
    expect(getOutput({ color: false })).toContain("Mode: foobar");
});

it("should when sourcemaps are enabled", () => {
    expect.assertions(1);
    printConfiguration(mockConsole, pkg, {
        proxySettings: {},
        useProxy: false,
        sourceMaps: true,
        mode: "foobar",
        userConfigured: null,
    });
    expect(getOutput({ color: false })).toContain("Sourcemaps: enabled");
});

it("should when sourcemaps are disabled", () => {
    expect.assertions(1);
    printConfiguration(mockConsole, pkg, {
        proxySettings: {},
        useProxy: false,
        sourceMaps: false,
        mode: "foobar",
        userConfigured: null,
    });
    expect(getOutput({ color: false })).toContain(
        'Sourcemaps: disabled (use "--source-maps" to enable)',
    );
});

it("should print proxy table", () => {
    expect.assertions(1);
    printConfiguration(mockConsole, pkg, {
        proxySettings: {
            proxy: {
                "^/foo": {
                    target: "https://example.net:1234/",
                },
                "^/bar": {
                    target: "https://example.org:1234/",
                },
            },
        },
        useProxy: true,
        sourceMaps: true,
        mode: "development",
        userConfigured: null,
    });
    expect(getOutput({ color: true })).toMatchInlineSnapshot(`
      <green><bold>Vue configuration</intensity></color>
          - Default configuration from mock-package@1.2.3

          <bold>Vue version:</intensity> 1.2.3
          Mode: development
          <bold>Sourcemaps:</intensity> <green>enabled</color>

        Proxy:
          ┌─────────┬─────────┬─────────────────────────────┐
          │ (index) │ url     │ target                      │
          ├─────────┼─────────┼─────────────────────────────┤
          │ 0       │ '^/foo' │ 'https://example.net:1234/' │
          │ 1       │ '^/bar' │ 'https://example.org:1234/' │
          └─────────┴─────────┴─────────────────────────────┘
    `);
});

it("should not print proxy table if empty", () => {
    expect.assertions(1);
    printConfiguration(mockConsole, pkg, {
        proxySettings: {
            proxy: {},
        },
        useProxy: true,
        sourceMaps: true,
        mode: "development",
        userConfigured: null,
    });
    expect(getOutput({ color: true })).toMatchInlineSnapshot(`
      <green><bold>Vue configuration</intensity></color>
          - Default configuration from mock-package@1.2.3

          <bold>Vue version:</intensity> 1.2.3
          Mode: development
          <bold>Sourcemaps:</intensity> <green>enabled</color>
    `);
});

it("should print resource table", () => {
    expect.assertions(1);
    printConfiguration(mockConsole, pkg, {
        proxySettings: {
            local: [
                { url: "/foo", dir: "./assets/foo" },
                { url: "/bar", dir: "./assets/bar" },
            ],
        },
        useProxy: false,
        sourceMaps: true,
        mode: "development",
        userConfigured: null,
    });
    expect(getOutput({ color: true })).toMatchInlineSnapshot(`
      <green><bold>Vue configuration</intensity></color>
          - Default configuration from mock-package@1.2.3

          <bold>Vue version:</intensity> 1.2.3
          Mode: development
          <bold>Sourcemaps:</intensity> <green>enabled</color>

        Local:
          ┌─────────┬────────┬────────────────┐
          │ (index) │ url    │ dir            │
          ├─────────┼────────┼────────────────┤
          │ 0       │ '/foo' │ './assets/foo' │
          │ 1       │ '/bar' │ './assets/bar' │
          └─────────┴────────┴────────────────┘
    `);
});
