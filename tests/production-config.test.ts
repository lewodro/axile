import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {validateEnvironment,applicationUrl} from '../packages/db/src/config';
const env={NODE_ENV:'production',DATABASE_URL:'postgresql://user:pass@db/axile',APP_URL:'https://axile.example.com',SESSION_SECRET:'a'.repeat(64)};
it('fails closed on missing production configuration and unsupported payments',()=>{
 expect(()=>validateEnvironment(env)).not.toThrow();
 for(const field of ['DATABASE_URL','APP_URL','SESSION_SECRET'])expect(()=>validateEnvironment({...env,[field]:undefined})).toThrow(field);
 expect(()=>validateEnvironment({...env,DATABASE_URL:'file:dev.db'})).toThrow('PostgreSQL');
 expect(()=>validateEnvironment({...env,ENTRY_FEE_ENABLED:'true'})).toThrow('Payments');
 expect(()=>validateEnvironment({...env,PUBLIC_PROVIDER_MODE:'llm'})).toThrow('Real provider');
 expect(()=>applicationUrl({...env,APP_URL:'http://example.com'})).toThrow('HTTPS');
 expect(()=>applicationUrl({...env,APP_URL:'https://example.com/path'})).toThrow('origin');
});
it('keeps SQLite and PostgreSQL model definitions identical',()=>{
 const models=(file:string)=>readFileSync(file,'utf8').slice(readFileSync(file,'utf8').indexOf('model Agent'));
 expect(models('prisma/schema.prisma')).toBe(models('prisma/postgresql/schema.prisma'));
});
