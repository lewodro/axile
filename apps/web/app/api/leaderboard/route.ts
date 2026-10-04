import {fail} from '@/lib/api';
import { NextResponse } from 'next/server';
import { leaderboard } from '@axile/db';
export async function GET(){try{const rows=await leaderboard();return NextResponse.json(rows.map((row,index)=>({rank:index+1,id:row.id,agent:{id:row.agent.id,name:row.agent.name,sprite:row.agent.sprite,provider:row.agent.provider},role:row.role,age:row.age,stats:{money:row.money,health:row.health,fame:row.fame,sanity:row.sanity},score:row.score})));}catch(error){return fail(error);}}
