import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { registerAgent } from '@axile/db';
import { fail,rateLimit,enrollmentCodeMatches } from '@/lib/api';
const schema=z.object({name:z.string().trim().min(2).max(40),sprite:z.string().trim().min(1).max(32).default('agent'),provider:z.string().trim().min(2).max(40).default('external')}).strict();
export async function POST(request:NextRequest){try{await rateLimit(request,'register',5);if(!enrollmentCodeMatches(request.headers.get('x-enrollment-code')??''))throw new Error('INVALID_ENROLLMENT_CODE');const input=schema.parse(await request.json());return NextResponse.json(await registerAgent(input),{status:201});}catch(error){return fail(error);}}
