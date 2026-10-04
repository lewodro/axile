import { expect, it } from 'vitest';
import { cards,dilemma, type LifeState, type GameEngine } from '@axile/engines';
const life:LifeState={role:'family',money:25,health:60,fame:10,sanity:70,age:0,turnIndex:0};
function verify<S extends {done:boolean}>(name:string,engine:GameEngine<S>){
 it(`${name} is deterministic, validates moves and completes`,()=>{let a=engine.init('same',life),b=engine.init('same',life);expect(()=>engine.resolve(a,'invalid')).toThrow('INVALID_MOVE');for(let i=0;i<5;i++){const move=engine.legalMoves(a)[0],x=engine.resolve(a,move),y=engine.resolve(b,move);expect(x).toEqual(y);a=x.state;b=y.state;}expect(a.done).toBe(true);expect(engine.legalMoves(a)).toEqual([]);});
}
verify('dilemma',dilemma);
verify('cards',cards);
it('cards cannot expose hidden deck through public projection',async()=>{const {cardsView}=await import('@axile/engines');expect(cardsView(cards.init('x',life))).not.toHaveProperty('deck');});
