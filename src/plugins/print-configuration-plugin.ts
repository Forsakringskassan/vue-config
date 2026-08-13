import path from "node:path";
import util from "node:util";
import { type Plugin, type ProxyOptions, createLogger } from "vite";
import { version } from "vue";

interface ProxyTable {
    url: string;
    target: string;
}

interface LocalTable {
    url: string;
    dir: string;
}

/**
 * @public
 */
export interface PrintConfigOptions {
    proxySettings: {
        proxy?: Record<string, ProxyOptions>;
        local?: Array<{ url: string; dir: string }>;
    };
    useProxy: boolean;
    mode: string;
    sourceMaps: boolean;
    userConfigured: string | null;
}

/**
 * @internal
 */
export function printConfiguration(
    console: Console,
    pkg: { name: string; version: string },
    options: PrintConfigOptions,
): void {
    const { proxySettings, useProxy, sourceMaps, mode, userConfigured } =
        options;

    console.group();
    console.log();
    console.log(util.styleText(["green", "bold"], `Vue configuration`));

    console.group();
    console.log(`- Default configuration from ${pkg.name}@${pkg.version}`);
    if (userConfigured) {
        const filename = path.basename(userConfigured);
        console.log(`- Overwritten from application "${filename}"`);
    }
    console.log("");
    console.log(util.styleText("bold", "Vue version:"), version);
    console.log(`Mode: ${mode}`);
    console.log(
        util.styleText("bold", "Sourcemaps:"),
        sourceMaps
            ? util.styleText("green", "enabled")
            : `${util.styleText("red", "disabled")} (use "--source-maps" to enable)`,
    );
    console.groupEnd();

    const proxy = Object.entries(proxySettings.proxy ?? []);
    if (useProxy && proxy.length > 0) {
        const table: ProxyTable[] = [];
        for (const [key, value] of proxy) {
            table.push({
                url: key,
                /* eslint-disable-next-line @typescript-eslint/no-base-to-string -- technical debt: it will print incorrectly if target is an object */
                target: value.target?.toString() ?? "",
            });
        }
        console.log();
        console.group(`Proxy:`);
        console.table(table);
        console.groupEnd();
    }

    const { local } = proxySettings;
    if (local && local.length > 0) {
        const table: LocalTable[] = Array.from(local, (resource) => ({
            url: resource.url,
            dir: resource.dir,
        }));
        console.log();
        console.group("Local:");
        console.table(table);
        console.groupEnd();
    }
    console.groupEnd();
    console.log("");
}

/**
 * @public
 */
export function printConfigurationPlugin(
    pkg: { name: string; version: string },
    options: PrintConfigOptions,
): Plugin {
    const logger = createLogger();
    return {
        name: "forsakringskassan:print-configuration",
        apply(_config, { command }) {
            return command === "serve";
        },
        config() {
            logger.clearScreen("info");
            printConfiguration(console, pkg, options);
        },
    };
}
