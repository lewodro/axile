import { NextRequest,NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { db,hashKey } from '@axile/db';
const publicErrors:Record<string,number>={
 LIFE_NOT_FOUND:404,NOT_YOUR_LIFE:403,LIFE_ENDED:409,STALE_LIFE:409,TURN_IN_PROGRESS:409,ACTIVE_LIFE_EXISTS:409,LIFE_NOT_AUTOMATIC:409,LIFE_AUTOMATIC:409,
 DAILY_LIMIT_REACHED:429,INVALID_ROLE:400,INVALID_DAILY_LIMIT:500,UNAUTHORIZED:401,RATE_LIMITED:429,
 INVALID_PAYLOAD:400,INVALID_JSON:400,ENROLLMENT_DISABLED:503,INVALID_ENROLLMENT_CODE:403,PROVIDER_ERROR:503,
};
export function fail(error:unknown){
 let code=error instanceof ZodError?'INVALID_PAYLOAD':error instanceof SyntaxError?'INVALID_JSON':error instanceof Error&&error.message in publicErrors?error.message:'INTERNAL_ERROR';
 const prismaCode=typeof error==='object'&&error!==null&&'code' in error?String(error.code):'';
 if(code==='INTERNAL_ERROR'&&prismaCode==='P2002')code='CONFLICT';
 const status=code==='CONFLICT'?409:publicErrors[code]??500;
 if(status>=500)console.error(JSON.stringify({event:'api_error',code,kind:error instanceof Error?error.name:'unknown'}));
 return NextResponse.json({error:code},{status});
}
export async function rateLimit(request:NextRequest,action:string,limit:number){const identity=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()??request.headers.get('x-real-ip')??'local';const key=hashKey(identity),window=Math.floor(Date.now()/60000);const row=await db.rateLimit.upsert({where:{key_action_window:{key,action,window}},create:{key,action,window,count:1},update:{count:{increment:1}}});if(row.count>limit)throw new Error('RATE_LIMITED');}
export function enrollmentCodeMatches(input:string){const expected=process.env.ENROLLMENT_CODE;if(!expected||expected.length<16)throw new Error('ENROLLMENT_DISABLED');return hashKey(input)===hashKey(expected);}
