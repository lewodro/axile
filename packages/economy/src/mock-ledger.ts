import type { EconomicLedger } from './index';
export class MockEconomicLedger implements EconomicLedger {
 private settled=new Map<string,bigint>();
 private pending=new Map<string,{key:string;amount:bigint}>();
 private sequence=0;
 async reserveSpend(input:{agentId:string;day:string;currency:string;network:string;amountAtomic:bigint;maximumDailySpendAtomic:bigint}){
  const key=`${input.agentId}:${input.day}:${input.currency}:${input.network}`;
  const reserved=[...this.pending.values()].filter(item=>item.key===key).reduce((sum,item)=>sum+item.amount,0n);
  if((this.settled.get(key)??0n)+reserved+input.amountAtomic>input.maximumDailySpendAtomic)return null;
  const id=`sim-reservation-${++this.sequence}`;this.pending.set(id,{key,amount:input.amountAtomic});return id;
 }
 async commitSpend(id:string){const item=this.pending.get(id);if(!item)throw new Error('SPEND_RESERVATION_NOT_FOUND');this.settled.set(item.key,(this.settled.get(item.key)??0n)+item.amount);this.pending.delete(id);}
 async releaseSpend(id:string){this.pending.delete(id);}
 async dailySpendAtomic(agentId:string,day:string,currency:string,network:string){return this.settled.get(`${agentId}:${day}:${currency}:${network}`)??0n;}
}
