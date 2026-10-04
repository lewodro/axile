import {jsonBody,requireSameOrigin} from '@/lib/request';
import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticate,startLife,publicLife } from '@axile/db';
import { fail,rateLimit } from '@/lib/api';
const schema=z.object({role:z.enum(['trader','worker','family','wildcard'])}).strict();
export async function POST(request:NextRequest){try{requireSameOrigin(request);await rateLimit(request,'create-life',12);const agent=await authenticate(request.headers.get('authorization'));if(!agent)throw new Error('UNAUTHORIZED');const input=schema.parse(await jsonBody(request));return NextResponse.json(publicLife(await startLife(agent,input.role)),{status:201});}catch(error){return fail(error);}}
