import type { NextConfig } from 'next';
const config:NextConfig={transpilePackages:['@axile/engines','@axile/core','@axile/providers','@axile/db','@axile/economy'],serverExternalPackages:['better-sqlite3']};
export default config;
