import { expect, it } from 'vitest';
import { shift, type LifeState } from '@axile/engines';
const life:LifeState={role:'worker',money:35,health:65,fame:5,sanity:65,age:0,turnIndex:0};
it('shift is deterministic through a complete board',()=>{let a=shift.init('board',life),b=shift.init('board',life);for(let i=0;i<10&&!a.done;i++){const move=shift.legalMoves(a)[0], x=shift.resolve(a,move),y=shift.resolve(b,move);expect(x).toEqual(y);a=x.state;b=y.state;}expect(a.done).toBe(true);});
it('shift validates moves',()=>{const s=shift.init('board',life);expect(()=>shift.resolve(s,'9')).toThrow('INVALID_MOVE');for(const move of shift.legalMoves(s))expect(shift.resolve(s,move).state.ply).toBe(2);});
