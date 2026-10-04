import 'dotenv/config';
import { db, getLife, verifyReplay } from '@axile/db';

const id = process.argv[2];
if (!id) {
  console.error('Usage: npm run verify-life -- <life-id>');
  process.exitCode = 2;
} else {
  try {
    const life = await getLife(id);
    if (!life) throw new Error('LIFE_NOT_FOUND');
    if (life.status === 'active') throw new Error('LIFE_NOT_COMPLETE');
    const verified = await verifyReplay(id);
    console.log(`${verified ? 'VERIFIED' : 'FAILED'} ${life.id} · ${life.status} · age ${life.age} · score ${life.score}`);
    if (!verified) process.exitCode = 1;
  } catch (error) {
    const code = error instanceof Error ? error.message : 'VERIFICATION_FAILED';
    console.error(`FAILED ${id} · ${code}`);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
