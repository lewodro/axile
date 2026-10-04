import { notFound } from 'next/navigation';
import { getLife, verifyReplay } from '@axile/db';
import { StatsView, Timeline } from '../../../components/life-view';
import { Sprite } from '../../../components/sprite';
import { PageReveal } from '../../../components/motion/primitives';

export const dynamic = 'force-dynamic';

export default async function Replay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const life = await getLife(id);
  if (!life) notFound();
  const verified = await verifyReplay(id);

  return <PageReveal className="replay-page">
    <div className="page-head"><div className="shell">
      <span className="eyebrow">FIELD NOTE / THE COMPLETE RECORD</span>
      <h1 className="display page-title">A life, <em>accounted for.</em></h1>
      <p>{life.agent.name} began as a {life.role}. {life.status === 'active' ? 'The record is still being written.' : `It ended at age ${life.age}.`} Every move below was saved when it happened.</p>
    </div></div>
    <div className="shell content">
      <div className="split">
        <div className="panel">
          <div className="life-heading"><Sprite role={life.role} /><div>
            <span className="eyebrow">{life.role.toUpperCase()} / {life.agent.provider.toUpperCase()}</span>
            <h2>{life.agent.name}</h2>
            <span className="fine">{life.startedAt.slice(0, 10)} → {life.endedAt?.slice(0, 10) ?? 'ONGOING'}</span>
          </div></div>
          <StatsView stats={life.stats} />
          <Timeline turnIndex={life.turnIndex} active={life.status === 'active'} />
        </div>
        <div className="panel">
          <span className="eyebrow">FINAL ACCOUNTING</span>
          <h2 className="display" style={{ fontSize: 90 }}>{life.score ?? '—'}</h2>
          <p className="fine">AGE {life.age} + MONEY {life.stats.money} + HEALTH {life.stats.health} + FAME {life.stats.fame} + SANITY {life.stats.sanity} + BONUS {life.achievementBonus}</p>
          <p className="fine">{life.achievements.join(' / ') || 'NO ACHIEVEMENTS'}</p>
          <p className="small-caps accent">{verified ? 'DETERMINISTIC REPLAY VERIFIED' : 'REPLAY STILL IN PROGRESS'}</p>
          {life.status !== 'active' && <>
            <a className="button secondary" href={`/api/lives/${life.id}/export`}>EXPORT CHARACTER RECORD <span>↓</span></a>
            <details><summary>TECHNICAL RECORD</summary><p className="fine" style={{ overflowWrap: 'anywhere' }}>SEED {life.seed}<br />LIFE ID {life.id}</p></details>
          </>}
        </div>
      </div>
      <div className="section" style={{ paddingTop: 80 }}>
        <span className="eyebrow">CHRONOLOGY / EVERY DECISION</span>
        <h2 className="display">The long way <em>here.</em></h2>
        {life.turns.length === 0 ? <p className="empty">This life has not made its first decision.</p> : life.turns.map((turn, i) => <article className="log-row" key={`${turn.index}:${turn.moveIndex}`}>
          <div className="mono">{String(i + 1).padStart(2, '0')}<br />AGE {turn.age}<br />{turn.game.toUpperCase()}</div>
          <div>
            <span className="eyebrow">{turn.story.title}</span>
            <p>{turn.story.scene}</p>
            <h3>{turn.move}</h3>
            <p className="muted">{turn.story.choice}</p>
            <p>“{turn.reason}”</p>
            <p>{turn.story.consequence} {turn.engineLog.join(' ')}</p>
            <div className="fine">DELTA {Object.entries(turn.deltas).map(([stat, n]) => `${stat.toUpperCase()} ${n >= 0 ? '+' : ''}${n}`).join(' / ')}</div>
            <div className="fine">AFTER M {turn.statsAfter.money} / H {turn.statsAfter.health} / F {turn.statsAfter.fame} / S {turn.statsAfter.sanity}</div>
            <details><summary>GAME STATE BEFORE MOVE</summary><pre className="game-state">{JSON.stringify(turn.stateBefore, null, 2)}</pre></details>
          </div>
        </article>)}
      </div>
    </div>
  </PageReveal>;
}
