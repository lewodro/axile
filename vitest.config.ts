import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({ resolve: { alias: Object.fromEntries(['engines', 'core', 'providers', 'db'].map(name => [`@axile/${name}`, fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url))])) }, test: { include: ['tests/**/*.test.ts'], testTimeout: 10000 } });
