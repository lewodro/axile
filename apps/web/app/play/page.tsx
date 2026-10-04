'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ROLES, type Role, type Stats } from '@axile/core';
import { LifeView, type PublicLife } from '../../components/life-view';
import { Sprite } from '../../components/sprite';

function PlayContent() {
  const params = useSearchParams();
  const suggested = params.get('role');
  const [role, setRole] = useState<Role>(suggested && suggested in ROLES ? suggested as Role : 'trader');
  const [life, setLife] = useState<PublicLife | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [previous, setPrevious] = useState<Stats | undefined>();
  const [eventTurn, setEventTurn] = useState<PublicLife['turns'][number] | undefined>();
  const [oldAge, setOldAge] = useState<number | undefined>();
  const [oldChapter, setOldChapter] = useState<number | undefined>();
  const [phase, setPhase] = useState('ready');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    fetch('/api/demo', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('YOUR SAVED LIFE COULD NOT BE LOADED.');
        return response.json() as Promise<PublicLife | null>;
      })
      .then(savedLife => { if (mounted) setLife(savedLife); })
      .catch(e => { if (mounted) setError(e instanceof Error ? e.message : 'YOUR SAVED LIFE COULD NOT BE LOADED.'); })
      .finally(() => { if (mounted) setRestoring(false); });
    return () => { mounted = false; };
  }, []);

  async function start() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/demo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLife(data);
      setPrevious(undefined);
      setEventTurn(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'THE LIFE COULD NOT BEGIN.');
    } finally {
      setBusy(false);
    }
  }

  async function step() {
    if (!life || busy) return;
    setBusy(true);
    setPhase('thinking');
    setError('');
    try {
      const response = await fetch(`/api/demo/${life.id}/step`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await pause(350);
      setEventTurn(data.turns.at(-1));
      setPhase('choice');
      await pause(650);
      setPrevious(life.stats);
      setOldAge(life.age);
      setOldChapter(life.turnIndex);
      setLife(data);
      setPhase('consequence');
      await pause(800);
      setOldAge(undefined);
      setOldChapter(undefined);
      setEventTurn(undefined);
      setPhase('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'THE DECISION DID NOT ARRIVE.');
      setPhase('ready');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="page-head"><div className="shell">
      <span className="eyebrow">FIELD NOTE / THE PARTICIPANT</span>
      <h1 className="display page-title">Begin a <em>brief eternity.</em></h1>
      <p>Choose a starting condition. The server chooses the games and the seed. The baseline agent makes legal decisions; you watch what they cost. Each decision waits for you, and your life is saved between visits.</p>
    </div></div>
    <div className="shell content">
      {error && <p className="notice" role="alert">{error}</p>}
      {restoring ? <div className="empty" role="status">Looking for the life you left here.</div> : life ? <>
        <LifeView life={life} previous={previous} phase={phase} onStep={step} busy={busy} eventTurn={eventTurn} ageOverride={oldAge} turnIndexOverride={oldChapter} />
        {life.status !== 'active' && <button className="button secondary" onClick={() => setLife(null)} style={{ marginTop: 24 }}>BEGIN ANOTHER LIFE <span>↗</span></button>}
      </> : <>
        <span className="eyebrow">01 / CHOOSE A ROLE</span>
        <div className="role-grid">{(Object.keys(ROLES) as Role[]).map(r => <button type="button" className={`role-card ${role === r ? 'selected' : ''}`} key={r} onClick={() => setRole(r)} aria-pressed={role === r} style={{ background: role === r ? 'var(--surface2)' : undefined, color: 'var(--text)', textAlign: 'left', cursor: 'pointer' }}>
          <Sprite role={r} /><h3>{r === 'family' ? 'Family Person' : r[0].toUpperCase() + r.slice(1)}</h3><p>{ROLES[r].description}</p><div className="tiny">{Object.entries(ROLES[r].stats).map(([key, value]) => <div key={key}>{key.toUpperCase()} {value}</div>)}</div>
        </button>)}</div>
        <div style={{ marginTop: 30 }}><button className="button" onClick={start} disabled={busy}>{busy ? 'A LIFE IS BEING WRITTEN.' : 'BEGIN AS ' + role.toUpperCase()} <span>↗</span></button></div>
      </>}
    </div>
  </>;
}

function pause(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

export default function Play() {
  return <Suspense fallback={<div className="shell content"><p className="thought">The first chapter is opening.</p></div>}><PlayContent /></Suspense>;
}
