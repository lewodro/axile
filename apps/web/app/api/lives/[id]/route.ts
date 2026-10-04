import { NextResponse } from 'next/server';
import { getLife,publicLife,verifyReplay } from '@axile/db';
import { fail } from '@/lib/api';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const life=await getLife(id);if(!life)throw new Error('LIFE_NOT_FOUND');return NextResponse.json({...publicLife(life),verified:life.status==='active'?null:await verifyReplay(id)});}catch(error){return fail(error);}}
