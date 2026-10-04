import { rng } from '@axile/engines';
import type { AgentProvider,AgentPrompt } from '@axile/core';
export class RandomProvider implements AgentProvider { async decide(prompt:AgentPrompt){return {move:rng(`random:${prompt.seedHint}`).pick(prompt.legalMoves),reason:'A legal choice from a seeded baseline.'};} }
import { z } from 'zod';
const decisionSchema=z.object({move:z.string().min(1).max(80),reason:z.string().max(1000)}).strict();
const responseSchema=z.union([decisionSchema,z.object({choices:z.array(z.object({message:z.object({content:z.string()})})).min(1)})]);
export class LLMProvider implements AgentProvider {
 constructor(private config:{url:string;apiKey:string;model:string;timeoutMs?:number;fetcher?:typeof fetch;beforeAttempt?:()=>Promise<void>}){const url=new URL(config.url);if(url.protocol!=='https:'||url.username||url.password||url.hash)throw Error('LLM_URL_MUST_BE_HTTPS');}
 async decide(prompt:AgentPrompt){let last:unknown;
  for(let attempt=0;attempt<2;attempt++){
   try{await this.config.beforeAttempt?.();const visiblePrompt={identity:{name:prompt.identity.name,role:prompt.role},role:prompt.role,age:prompt.age,stats:prompt.stats,game:prompt.game,gameState:prompt.gameState,legalMoves:prompt.legalMoves,recentHistory:prompt.recentHistory,turnIndex:prompt.turnIndex,moveIndex:prompt.moveIndex};const response=await (this.config.fetcher??fetch)(this.config.url,{method:'POST',redirect:'error',headers:{'content-type':'application/json',authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:'system',content:'You are an agent living one life. Choose exactly one legal move. Respond only with JSON: {"move":"...","reason":"..."}. Never invent game state.'},{role:'user',content:JSON.stringify(visiblePrompt)}],temperature:0,max_tokens:256}),signal:AbortSignal.timeout(this.config.timeoutMs??12000)});
    if(!response.ok)throw new Error(`LLM_HTTP_${response.status}`);
    const envelope=responseSchema.parse(await readResponse(response));
    const decision='choices' in envelope?decisionSchema.parse(JSON.parse(envelope.choices[0].message.content)):envelope;
    if(!prompt.legalMoves.includes(decision.move))throw new Error('INVALID_AGENT_MOVE');return decision;
   }catch(error){last=error;if(error instanceof Error&&['LLM_HTTP_401','LLM_HTTP_403','PROVIDER_BUDGET_EXHAUSTED'].includes(error.message))break;}
  }
  throw last instanceof Error?last:new Error('LLM_FAILED');
 }
}
export function llmFromEnv(){const {LLM_API_URL,LLM_API_KEY,LLM_MODEL}=process.env;if(!LLM_API_URL||!LLM_API_KEY||!LLM_MODEL)throw new Error('LLM_NOT_CONFIGURED');return new LLMProvider({url:LLM_API_URL,apiKey:LLM_API_KEY,model:LLM_MODEL});}

async function readResponse(response:Response){
 const reader=response.body?.getReader();if(!reader)throw Error('LLM_EMPTY_RESPONSE');let size=0;const chunks:Uint8Array[]=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536)throw Error('LLM_RESPONSE_TOO_LARGE');chunks.push(value);}}catch(error){await reader.cancel();throw error;}finally{reader.releaseLock();}
 return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
