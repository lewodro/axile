import {fail} from '@/lib/api';
import { NextResponse } from 'next/server';
import { db,getLife,publicLife } from '@axile/db';
export async function GET(){try{const rows=await db.life.findMany({orderBy:{startedAt:'desc'},take:12,select:{id:true}});const lives=await Promise.all(rows.map(row=>getLife(row.id)));return NextResponse.json(lives.filter(life=>life!==null).map(publicLife));}catch(error){return fail(error);}}
