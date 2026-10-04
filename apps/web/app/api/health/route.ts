import { NextResponse } from 'next/server';
import { db } from '@axile/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'ok' }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    console.error(JSON.stringify({ event: 'health_check_failed', dependency: 'database' }));
    return NextResponse.json({ status: 'unavailable', database: 'unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
