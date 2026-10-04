import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { publicLife, setLifeAutoRun } from '@axile/db';
import { fail, rateLimit } from '@/lib/api';

const schema = z.object({ autoRun: z.boolean() }).strict();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await rateLimit(request, 'demo-automation', 30);
    const visitor = request.cookies.get('axile_visitor')?.value;
    if (!visitor) throw new Error('UNAUTHORIZED');
    const { id } = await params;
    const { autoRun } = schema.parse(await request.json());
    return NextResponse.json(publicLife(await setLifeAutoRun(id, visitor, autoRun)));
  } catch (error) {
    return fail(error);
  }
}
