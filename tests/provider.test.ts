import { expect,it,vi } from 'vitest';
import { LLMProvider } from '@axile/providers';
import { createLife,promptFor } from '@axile/core';
it('rejects unsafe provider URLs and disables redirects carrying credentials',async()=>{
 expect(()=>new LLMProvider({url:'http://localhost/api',apiKey:'secret',model:'test'})).toThrow('HTTPS');
 const fetcher=vi.fn<typeof fetch>(async()=>new Response(JSON.stringify({move:prompt.legalMoves[0],reason:'ok'})));
 await new LLMProvider({url:'https://example.invalid',apiKey:'secret',model:'test',fetcher}).decide(prompt);
 expect(fetcher.mock.calls[0][1]?.redirect).toBe('error');
});
it('cancels oversized provider output and reserves each attempt before sending',async()=>{
 const beforeAttempt=vi.fn(async()=>{});const fetcher=vi.fn(async()=>new Response('x'.repeat(70000)));
 await expect(new LLMProvider({url:'https://example.invalid',apiKey:'secret',model:'test',fetcher,beforeAttempt}).decide(prompt)).rejects.toThrow('LLM_RESPONSE_TOO_LARGE');
 expect(beforeAttempt).toHaveBeenCalledTimes(2);
});
const prompt=promptFor(createLife({id:'a',agent:{id:'a',name:'A',sprite:'a',provider:'llm'},role:'worker',seed:'provider'}));
it('parses valid LLM JSON without exposing private game state',async()=>{const fetcher=vi.fn(async()=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({move:prompt.legalMoves[0],reason:'A thought.'})}}]}),{status:200}));const provider=new LLMProvider({url:'https://example.invalid',apiKey:'private',model:'model',fetcher});expect(await provider.decide(prompt)).toEqual({move:prompt.legalMoves[0],reason:'A thought.'});expect(fetcher).toHaveBeenCalledOnce();});
it('retries malformed and illegal output then fails safely',async()=>{const fetcher=vi.fn(async()=>new Response(JSON.stringify({move:'unavailable',reason:'wrong'})));const provider=new LLMProvider({url:'https://example.invalid',apiKey:'private',model:'model',fetcher});await expect(provider.decide(prompt)).rejects.toThrow('INVALID_AGENT_MOVE');expect(fetcher).toHaveBeenCalledTimes(2);});
it('retries timeout-like failures',async()=>{const fetcher=vi.fn(async()=>{throw new Error('timeout')});const provider=new LLMProvider({url:'https://example.invalid',apiKey:'private',model:'model',fetcher});await expect(provider.decide(prompt)).rejects.toThrow('timeout');expect(fetcher).toHaveBeenCalledTimes(2);});
it('completes fourteen chapters with a valid LLM transport',async()=>{
 const {runLife}=await import('@axile/core');
 const fetcher:typeof fetch=async(_url,options)=>{const request=JSON.parse(String(options?.body));const prompt=JSON.parse(request.messages[1].content);return new Response(JSON.stringify({move:prompt.legalMoves[0],reason:'First legal move.'}));};
 const provider=new LLMProvider({url:'https://example.invalid',apiKey:'private',model:'model',fetcher});
 const life=createLife({id:'llm-life',agent:{id:'llm',name:'Model',sprite:'llm',provider:'llm'},role:'worker',seed:'llm-complete'});
 const final=await runLife(life,provider);
 expect(final.status).toBe('completed');expect(final.turnIndex).toBe(14);expect(final.turns.every(turn=>turn.reason==='First legal move.')).toBe(true);
});
