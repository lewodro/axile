type Environment=Record<string,string|undefined>;
export function databaseUrl(env:Environment=process.env){
 const value=env.DATABASE_URL;
 if(env.NODE_ENV==='production'&&(!value||!/^postgres(ql)?:\/\//.test(value)))throw Error('DATABASE_URL must be a PostgreSQL connection URL in production.');
 if(value&&!/^(file:|postgres(ql)?:\/\/)/.test(value))throw Error('DATABASE_URL must use file: or postgresql://.');
 return value??'file:./prisma/dev.db';
}
export function applicationUrl(env:Environment=process.env){
 if(env.NODE_ENV==='production'&&!env.APP_URL)throw Error('APP_URL is required in production, for example https://axile.example.com.');
 let url:URL;try{url=new URL(env.APP_URL??'http://localhost:3000');}catch{throw Error('APP_URL must be a valid absolute origin.');}
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if((url.protocol!=='https:'&&!(local&&url.protocol==='http:'))||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('APP_URL must be an HTTPS origin (HTTP is allowed only on loopback for local testing).');
 return url;
}
export function integerSetting(name:string,fallback:number,min:number,max:number,env:Environment=process.env){
 const value=Number(env[name]??fallback);if(!Number.isSafeInteger(value)||value<min||value>max)throw Error(`${name} must be an integer between ${min} and ${max}.`);return value;
}
export function validateEnvironment(env:Environment=process.env){
 databaseUrl(env);applicationUrl(env);
 if(env.NODE_ENV==='production'&&(!env.SESSION_SECRET||env.SESSION_SECRET.length<32||env.SESSION_SECRET.includes('replace')))throw Error('SESSION_SECRET must be a stable random secret of at least 32 characters.');
 if(env.ENROLLMENT_CODE&&env.ENROLLMENT_CODE.length<32)throw Error('ENROLLMENT_CODE must have at least 32 characters or be omitted to disable registration.');
 if(env.ENTRY_FEE_ENABLED&&env.ENTRY_FEE_ENABLED!=='false')throw Error('Payments are not implemented for public Axile. ENTRY_FEE_ENABLED must be false.');
 if(env.ECONOMY_MODE&&env.ECONOMY_MODE!=='SIMULATED')throw Error('Only the isolated SIMULATED economy demo is supported.');
 for(const [key,fallback,min,max] of [['PORT',3000,1,65535],['MAX_LIVES_PER_AGENT_PER_DAY',20,1,100],['WORKER_INTERVAL_MS',1500,100,60000],['MAX_ACTIVE_DEMO_LIVES',50,1,200],['MAX_PROVIDER_CALLS_PER_DAY',200,1,10000]] as const)integerSetting(key,fallback,min,max,env);
 if(env.PUBLIC_PROVIDER_MODE&&!['mock','llm'].includes(env.PUBLIC_PROVIDER_MODE))throw Error('PUBLIC_PROVIDER_MODE must be mock or llm.');
 if(env.PUBLIC_PROVIDER_MODE==='llm'&&(!env.LLM_API_URL||!env.LLM_API_KEY||!env.LLM_MODEL))throw Error('Real provider mode requires LLM_API_URL, LLM_API_KEY and LLM_MODEL.');
}
