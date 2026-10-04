import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate,submitMove,publicLife } from '@axile/db';
import { fail,rateLimit } from '@/lib/api';
const schema=z.object({move:z.string().min(1).max(80),reason:z.string().max(1000).default('No explanation supplied.')}).strict();
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{await rateLimit(request,'submit-move',120);const agent=await authenticate(request.headers.get('authorization'));if(!agent)throw new Error('UNAUTHORIZED');const {id}=await params;const decision=schema.parse(await request.json());return NextResponse.json(publicLife(await submitMove(id,agent.id,decision)));}catch(error){return fail(error);}}
