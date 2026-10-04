import { expect,it,vi } from 'vitest';
import { LLMProvider } from '@axile/providers';
import { createLife,promptFor } from '@axile/core';
const prompt=promptFor(createLife({id:'a',agent:{id:'a',name:'A',sprite:'a',provider:'llm'},role:'worker',seed:'provider'}));
it('parses valid LLM JSON without exposing private game state',async()=>{const fetcher=vi.fn(async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({move:prompt.legalMoves[0],reason:'A thought.'})}}]}),{status:200}));const provider=new LLMProvider({url:'https://example.invalid',apiKey:'private',model:'model',fetcher});expect(await provider.decide(prompt)).toEqual({move:prompt.legalMoves[0],reason:'A thought.'});expect(fetcher).toHaveBeenCalledOnce();});
it('reports a typed invalid-move error for illegal output',async()=>{const fetcher=vi.fn(async()=>new Response(JSON.stringify({move:'unavailable',reason:'wrong'})));const provider=new LLMProvider({url:'https://example.invalid',apiKey:'private',model:'model',fetcher});await expect(provider.decide(prompt)).rejects.toThrow('LLM_INVALID_MOVE');expect(fetcher).toHaveBeenCalledOnce();});
it('preserves timeout failures as a typed timeout error',async()=>{const fetcher=vi.fn(async()=>{throw new DOMException('request timed out','TimeoutError')});const provider=new LLMProvider({url:'https://example.invalid',apiKey:'private',model:'model',fetcher});await expect(provider.decide(prompt)).rejects.toThrow('LLM_TIMEOUT');expect(fetcher).toHaveBeenCalledOnce();});
it('completes fourteen chapters with a valid LLM transport',async()=>{
 const {runLife}=await import('@axile/core');
 const fetcher:typeof fetch=async(_url,options)=>{const request=JSON.parse(String(options?.body));const prompt=JSON.parse(request.messages[1].content);return new Response(JSON.stringify({move:prompt.legalMoves[0],reason:'First legal move.'}));};
 const provider=new LLMProvider({url:'https://example.invalid',apiKey:'private',model:'model',fetcher});
 const life=createLife({id:'llm-life',agent:{id:'llm',name:'Model',sprite:'llm',provider:'llm'},role:'worker',seed:'llm-complete'});
 const final=await runLife(life,provider);
 expect(final.status).toBe('completed');expect(final.turnIndex).toBe(14);expect(final.turns.every(turn=>turn.reason==='First legal move.')).toBe(true);
});
