import {requireSameOrigin} from '@/lib/request';
import {readVisitor} from '@/lib/session';
import { NextRequest,NextResponse } from 'next/server';
import { getLife,submitMove,publicLife } from '@axile/db';
import { promptFor } from '@axile/core';
import { RandomProvider } from '@axile/providers';
import { fail,rateLimit } from '@/lib/api';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{requireSameOrigin(request);await rateLimit(request,'demo-step',120);const {id}=await params,visitor=readVisitor(request.cookies.get('axile_visitor')?.value);if(!visitor)throw new Error('UNAUTHORIZED');const life=await getLife(id);if(!life)throw new Error('LIFE_NOT_FOUND');if(life.agent.id!==visitor)throw new Error('NOT_YOUR_LIFE');if(life.status!=='active')throw new Error('LIFE_ENDED');const decision=await new RandomProvider().decide(promptFor(life));return NextResponse.json(publicLife(await submitMove(id,visitor,decision)));}catch(error){return fail(error);}}
