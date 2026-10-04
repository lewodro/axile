import { authorizeEntry,type EconomicPolicy } from '@axile/economy';
import { MockWalletAdapter } from '@axile/economy/mock-wallet';
import { MockEconomicLedger } from '@axile/economy/mock-ledger';
const policy:EconomicPolicy={allowedActions:['ENTER_GAME'],rules:{ENTER_GAME:{enabled:true,subjectIds:['market-demo'],amountAtomic:250000n,currency:'CREDIT',network:'mocknet',destination:'axile-treasury-demo'}},approvedDestinations:['axile-treasury-demo'],approvedNetworks:['mocknet'],maxTransactionAtomic:500000n,maxDailySpendAtomic:700000n,minimumReserveAtomic:100000n,maximumEntryFeeAtomic:300000n};
const wallet=new MockWalletAdapter([{address:'agent-wallet-demo',currency:'CREDIT',network:'mocknet',balanceAtomic:1000000n}],10000n);
const ledger=new MockEconomicLedger();
const agent={async chooseIntent(){return {action:'ENTER_GAME',gameId:'market-demo'};}};
const {receipt,result}=await authorizeEntry(await agent.chooseIntent(),{agentId:'agent-demo',walletAddress:'agent-wallet-demo',day:'2099-01-01'},policy,wallet,ledger,async verified=>({lifeStarts:true,payment:verified.transactionId}),step=>console.log(`[${step.mode}] ${step.stage}`,JSON.stringify(step.details)));
console.log(`[${receipt.mode}] entry result`,JSON.stringify(result));
