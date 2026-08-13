import fs from "node:fs/promises";
import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";
import esbuild from "esbuild";
import isCI from "is-ci";
import pkg from "./package.json" with { type: "json" };

const peerDependencies = Object.values(pkg.peerDependencies);
const externalDependencies = pkg.externalDependencies;

/**
 * @param {import("esbuild").BuildOptions} options
 * @returns {Promise<void>}
 */
async function build(options) {
    const result = await esbuild.build({
        outdir: "dist/esm",
        bundle: true,
        metafile: true,
        platform: "node",
        logLevel: "info",
        target: "node22",
        format: "esm",
        outExtension: { ".js": ".mjs" },
        external: [...peerDependencies, ...externalDependencies],
        ...options,
    });
    console.log(await esbuild.analyzeMetafile(result.metafile));
}

/**
 * @param {string} filename
 * @returns {Promise<void>}
 */
async function apiExtractor(filename) {
    const config = ExtractorConfig.loadFileAndPrepare(filename);
    const result = Extractor.invoke(config, {
        localBuild: !isCI,
        showVerboseMessages: true,
    });

    if (result.succeeded) {
        console.log(`API Extractor completed successfully`);
    } else {
        const { errorCount, warningCount } = result;
        console.error(
            [
                "API Extractor completed with",
                `${errorCount} error(s) and ${warningCount} warning(s)`,
            ].join("\n"),
        );
        process.exitCode = 1;
    }
}

async function run() {
    await fs.rm("dist", { recursive: true, force: true });
    await build({
        entryPoints: ["src/index.ts"],
    });
    await apiExtractor("api-extractor.json");
}

await run();
