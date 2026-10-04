import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
const aliases=[
 {find:'@axile/economy/mock-ledger',replacement:fileURLToPath(new URL('./packages/economy/src/mock-ledger.ts',import.meta.url))},
 {find:'@axile/economy/mock-wallet',replacement:fileURLToPath(new URL('./packages/economy/src/mock-wallet.ts',import.meta.url))},
 ...['engines','core','providers','db','economy'].map(name=>({find:`@axile/${name}`,replacement:fileURLToPath(new URL(`./packages/${name}/src/index.ts`,import.meta.url))}))
];
export default defineConfig({resolve:{alias:aliases},test:{include:['tests/**/*.test.ts'],testTimeout:10000}});
