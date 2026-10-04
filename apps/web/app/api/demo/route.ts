import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { db,startLife,publicLife } from '@axile/db';
import { configuredProviderName } from '@axile/providers';
import { fail,rateLimit } from '@/lib/api';
const schema=z.object({role:z.enum(['trader','worker','family','wildcard'])}).strict();
export async function POST(request:NextRequest){try{await rateLimit(request,'demo-create',8);const {role}=schema.parse(await request.json());const visitor=request.cookies.get('axile_visitor')?.value;const id=visitor&&/^[0-9a-f-]{36}$/.test(visitor)?visitor:randomUUID();const provider=configuredProviderName();const agent=await db.agent.upsert({where:{id},update:{provider},create:{id,name:'An Unnamed Visitor',sprite:'visitor',provider}});const life=await startLife({id:agent.id,name:agent.name,sprite:agent.sprite,provider:agent.provider,personality:agent.personality},role,undefined,{autoRun:true});const response=NextResponse.json(publicLife(life),{status:201});response.cookies.set('axile_visitor',id,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*365});return response;}catch(error){return fail(error);}}
