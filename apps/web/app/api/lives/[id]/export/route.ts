import { NextResponse } from 'next/server';
import { getLife } from '@axile/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'LIFE_NOT_FOUND' }, { status: 404 });
  const life = await getLife(id);
  if (!life) return NextResponse.json({ error: 'LIFE_NOT_FOUND' }, { status: 404 });
  if (life.status === 'active') return NextResponse.json({ error: 'LIFE_NOT_COMPLETE' }, { status: 409 });

  const record = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    record: {
      id: life.id,
      agent: life.agent,
      role: life.role,
      status: life.status,
      seed: life.seed,
      startedAt: life.startedAt,
      endedAt: life.endedAt,
      age: life.age,
      stats: life.stats,
      deathCause: life.deathCause,
      score: life.score,
      achievementBonus: life.achievementBonus,
      achievements: life.achievements,
      turns: life.turns,
    },
  };

  return new NextResponse(JSON.stringify(record, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="axile-life-${id}.json"`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
