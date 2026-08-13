# `@forsakringskassan/vue-config`

Shared configuration for building Vue.js applications.

## Vite plugins

### Print configuration

**Syntax**

```ts
printConfiguration(pkg, options);
```

**Parameters**

`pkg: { name: string, version: string }`  
Parsed `package.json` from the originating configuration package.

`options: object`  
Options used when generating the Vite configuration.

- `proxySettings` - Proxy settings passed to `@forsakringskassan/apimock-express`.
- `useProxy` - True if user requested proxy instead of static mocks.
- `mode` - Vite mode.
- `sourceMaps` - True if user requested sourcemaps to be enabled.
- `userConfigured` - Filename with custom changes to the Vite configuration.
