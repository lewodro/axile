import { expect,it } from 'vitest';
import { createLife,runLife,stepLife,replayLife,scoreLife,applyDeltas,ROLES,advanceLife } from '@axile/core';
import { RandomProvider } from '@axile/providers';
const agent={id:'a',name:'A',sprite:'a',provider:'random'};
const make=(seed='test')=>createLife({id:'life',agent,role:'worker',seed,now:'2000-01-01T00:00:00.000Z'});
it('runs fourteen chapters and replays exactly',async()=>{const start=make();const final=await runLife(start,new RandomProvider());expect(final.status).toBe('completed');expect(final.turnIndex).toBe(14);expect(final.age).toBe(70);expect(replayLife(start,final.turns).score).toBe(final.score);expect((await runLife(make(),new RandomProvider())).turns).toEqual(final.turns);});
it('clamps every stat and scores audited components',()=>{expect(applyDeltas(ROLES.worker.stats,{money:1000,health:-1000})).toMatchObject({money:100,health:0});const life=make();expect(scoreLife(life).score).toBe(170);});
it('collapses when a stat reaches zero',()=>{let life=createLife({id:'l',agent,role:'trader',seed:'zero'});life={...life,stats:{...life.stats,sanity:1}};life=stepLife(life,{move:'INVALID_AGENT_MOVE',reason:'Wait.'});expect(life.stats.sanity).toBe(0);expect(life.status).toBe('collapsed');expect(life.score).toBeTypeOf('number');});
it('falls back after invalid decisions and timeouts',async()=>{const life=make();const bad=await advanceLife(life,{decide:async()=>({move:'nonsense',reason:'wrong'})});expect(bad.turns[0].invalid).toBe(true);const timed=await advanceLife(life,{decide:async()=>{throw new Error('timeout')}});expect(timed.turns[0].invalid).toBe(true);});
