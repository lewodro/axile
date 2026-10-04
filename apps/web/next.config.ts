import type { NextConfig } from 'next';
const config:NextConfig={transpilePackages:['@axile/engines','@axile/core','@axile/providers','@axile/db'],serverExternalPackages:['better-sqlite3']};
export default config;
