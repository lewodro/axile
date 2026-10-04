import { expect, it } from 'vitest';
import { nim, type LifeState } from '@axile/engines';
const life: LifeState = { role:'worker',money:35,health:65,fame:5,sanity:65,age:0,turnIndex:0 };
it('nim resolves deterministically to completion', () => { let a=nim.init('stone',life), b=nim.init('stone',life); for(let i=0;i<20&&!a.done;i++){const move=nim.legalMoves(a)[0]; const x=nim.resolve(a,move), y=nim.resolve(b,move); expect(x).toEqual(y); a=x.state;b=y.state;} expect(a.done).toBe(true); });
it('nim rejects illegal moves and accepts all legal choices',()=> {const s=nim.init('stone',life);expect(()=>nim.resolve(s,'8:20')).toThrow('INVALID_MOVE');for(const move of nim.legalMoves(s)) expect(nim.resolve(s,move).state.step).toBe(1);});
