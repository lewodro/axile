import 'dotenv/config';
import { defineConfig } from 'prisma/config';
const url=process.env.DATABASE_URL??'file:./prisma/dev.db';
const postgres=/^postgres(ql)?:/.test(url);
export default defineConfig({schema:postgres?'prisma/postgresql/schema.prisma':'prisma/schema.prisma',migrations:{path:postgres?'prisma/postgresql/migrations':'prisma/migrations'},datasource:{url}});
