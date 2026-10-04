import { NextRequest,NextResponse } from 'next/server';
import { getLife,runAgentTurn,publicLife } from '@axile/db';
import { providerFromEnv } from '@axile/providers';
import { fail,rateLimit } from '@/lib/api';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{await rateLimit(request,'demo-step',120);const {id}=await params,visitor=request.cookies.get('axile_visitor')?.value;if(!visitor)throw new Error('UNAUTHORIZED');const life=await getLife(id);if(!life)throw new Error('LIFE_NOT_FOUND');if(life.agent.id!==visitor)throw new Error('NOT_YOUR_LIFE');return NextResponse.json(publicLife(await runAgentTurn(id,providerFromEnv())));}catch(error){return fail(error);}}
