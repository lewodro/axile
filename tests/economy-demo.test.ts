import { expect,it } from 'vitest';
import { createLife,runLife } from '@axile/core';
import { RandomProvider } from '@axile/providers';
it('keeps deterministic game outcomes reproducible after wallet package addition',async()=>{const life=createLife({id:'unchanged',agent:{id:'baseline',name:'Baseline',sprite:'worker',provider:'random'},role:'worker',seed:'engine-stays-pure'});const first=await runLife(life,new RandomProvider());const second=await runLife({...life},new RandomProvider());expect(first.turns).toEqual(second.turns);expect(first.score).toBe(second.score);});
