'use client';

import Link from 'next/link';
import { Sprite } from './sprite';
import { AgeProgression, AgentThinking, DeathSequence, DecisionReveal, GameResolution, PageReveal, StatChange } from './motion/primitives';
import type { AgentPrompt, Role, Stats, TurnRecord } from '@axile/core';

export interface PublicLife {
  id: string;
  agent: { id: string; name: string; sprite: string; provider: string };
  role: Role;
  status: 'active' | 'completed' | 'collapsed';
  stats: Stats;
  age: number;
  turnIndex: number;
  moveIndex: number;
  game: string | null;
  prompt: Omit<AgentPrompt, 'seedHint'> | null;
  turns: TurnRecord[];
  achievements: string[];
  achievementBonus: number;
  score: number | null;
  startedAt: string;
  endedAt: string | null;
  verified?: boolean | null;
}

export function StatsView({ stats, previous }: { stats: Stats; previous?: Stats }) {
  return <div className="stat-grid">{(['money', 'health', 'fame', 'sanity'] as const).map(key => <StatChange key={key} label={key} value={stats[key]} previous={previous?.[key]} />)}</div>;
}

export function Timeline({ turnIndex, active }: { turnIndex: number; active: boolean }) {
  return <div className="timeline" aria-label="Fourteen life chapters">{Array.from({ length: 14 }, (_, i) => <span key={i} className={i < turnIndex ? 'done' : active && i === turnIndex ? 'current' : ''}>{String((i + 1) * 5).padStart(2, '0')}</span>)}</div>;
}

export function LifeView({ life, previous, phase = 'ready', onStep, busy = false, eventTurn, ageOverride, turnIndexOverride }: {
  life: PublicLife;
  previous?: Stats;
  phase?: string;
  onStep?: () => void;
  busy?: boolean;
  eventTurn?: TurnRecord;
  ageOverride?: number;
  turnIndexOverride?: number;
}) {
  const latest = eventTurn ?? life.turns.at(-1);
  const age = ageOverride ?? life.age;
  const chapter = turnIndexOverride ?? life.turnIndex;

  return <PageReveal className="life-view">
    <div className="life-heading"><Sprite role={life.role} /><div>
      <span className="eyebrow">{life.agent.provider.toUpperCase()} / {life.role.toUpperCase()}</span>
      <h2>{life.agent.name}</h2>
      <AgeProgression age={age} />
      <span className="fine"> · CHAPTER {Math.min(chapter + 1, 14)} / 14</span>
    </div></div>
    <StatsView stats={life.stats} previous={previous} />
    <Timeline turnIndex={chapter} active={life.status === 'active'} />
    <div className="split">
      <div className="panel">
        <span className="eyebrow">CURRENT GAME</span>
        <h2>{life.game ? life.game.toUpperCase() : life.status === 'completed' ? 'THE END' : 'COLLAPSE'}</h2>
        {life.prompt ? <>
          <p className="muted">{gameIntro(life.prompt.game, age)}</p>
          <GameResolution identity={`${life.game}:${life.turnIndex}:${life.moveIndex}`}>
            {formatGame(life.prompt.game, life.prompt.gameState)}
          </GameResolution>
          <div className="choice-row">{life.prompt.legalMoves.map(move => <span className="choice" key={move}>{move}</span>)}</div>
          {onStep && <button className="button" disabled={busy} onClick={onStep}>{busy ? 'AN AGENT IS THINKING.' : 'LET THE AGENT DECIDE'} <span>↗</span></button>}
        </> : <div className="notice">{life.status === 'completed' ? 'Seventy years. The record is closed.' : 'A statistic reached zero. The record is closed.'}</div>}
      </div>
      <div className="panel">
        <span className="eyebrow">LATEST DECISION</span>
        {latest ? <>
          <div className="notice"><strong>{latest.story.title}</strong><p>{latest.story.scene}</p></div>
          <DecisionReveal identity={`${latest.index}:${latest.move}:${phase}`}>
            <h2 className="thought">{phase === 'thinking' ? <AgentThinking label="THE AGENT IS THINKING" /> : phase === 'choice' ? `It chose ${latest.move}.` : latest.move}</h2>
          </DecisionReveal>
          <p className="muted">{phase !== 'thinking' && phase !== 'choice' ? latest.reason : 'The reason is arriving.'}</p>
          {phase !== 'choice' && phase !== 'thinking' && <>
            <div className="small-caps accent">THE CHOICE</div><p className="muted">{latest.story.choice}</p>
            <div className="small-caps accent">CONSEQUENCE</div><p className="muted">{latest.story.consequence} {latest.engineLog.join(' ')}</p>
            <div className="fine">{Object.entries(latest.deltas).map(([stat, delta]) => `${stat.toUpperCase()} ${delta >= 0 ? '+' : ''}${delta}`).join(' · ')}</div>
          </>}
        </> : <p className="thought">No decisions yet. This is the most peaceful it will be.</p>}
        {life.status !== 'active' && <DeathSequence><div className="final-score">
          <span className="eyebrow">FINAL SCORE</span><div className="display" style={{ fontSize: '90px' }}>{life.score}</div>
          <p className="fine">AGE {life.age} + FOUR STATS + {life.achievementBonus} ACHIEVEMENT POINTS</p>
          <p className="fine">{life.achievements.join(' / ') || 'NO ACHIEVEMENTS'}</p>
          <Link href={`/lives/${life.id}`} className="button secondary">READ THE REPLAY <span>↗</span></Link>
        </div></DeathSequence>}
      </div>
    </div>
  </PageReveal>;
}

function gameIntro(game: string, age: number) {
  const lines: Record<string, string> = {
    market: 'The market moves. Your position follows, sometimes reluctantly.', chess: 'The board offers certainty. You have to find it.',
    nim: 'The stones have no sympathy for your schedule.', shift: 'Three marks make a line. Four make a complaint.',
    dilemma: 'Someone else is deciding whether to trust you.', cards: 'The next card has already been shuffled.',
  };
  return `AGE ${age}. ${lines[game] ?? 'A decision is waiting.'}`;
}

function formatGame(game: string, state: unknown) {
  const x = state as Record<string, unknown>;
  if (game === 'market') return `REGIME ${String(x.regime).toUpperCase()}\nPAST PRICES ${JSON.stringify(x.history)}\nROUND ${x.round} / ${x.totalRounds}`;
  if (game === 'chess') return `${x.puzzle}\nFEN ${x.fen}\nMOVE ${x.move}`;
  if (game === 'nim') return `PILES ${JSON.stringify(x.piles)}\nROUND ${x.rounds}`;
  if (game === 'shift') { const board = x.board as string[]; return `${board.slice(0, 3).join(' ')}\n${board.slice(3, 6).join(' ')}\n${board.slice(6).join(' ')}\nROUND ${x.round}`; }
  if (game === 'dilemma') return `ROUND ${x.round} / ${x.total}\nHISTORY ${JSON.stringify(x.history)}`;
  if (game === 'cards') return `VISIBLE CARD ${x.visible}\nROUND ${x.round} / ${x.total}`;
  return JSON.stringify(state, null, 2);
}
