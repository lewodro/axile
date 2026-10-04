import type { Confirmation,PreparedTransaction,TransferPlan,WalletAdapter } from './index';
interface Account {address:string;currency:string;network:string;balanceAtomic:bigint}
export class MockWalletAdapter implements WalletAdapter {
 readonly mode='SIMULATED' as const;
 private readonly accounts=new Map<string,Account>();
 private readonly transactions=new Map<string,{plan:TransferPlan;state:'submitted'|'confirmed';confirmationId:string}>();
 private sequence=0;
 constructor(accounts:Account[],private readonly feeAtomic=0n,private readonly autoConfirm=true){for(const account of accounts)this.accounts.set(this.accountKey(account.address,account.currency,account.network),{...account});}
 async getBalanceAtomic(address:string,currency:string,network:string){return this.account(address,currency,network).balanceAtomic;}
 async estimateFeeAtomic(_plan:TransferPlan){return this.feeAtomic;}
 async prepareTransaction(plan:TransferPlan):Promise<PreparedTransaction>{this.account(plan.from,plan.currency,plan.network);return {reference:`sim-prepared-${this.sequence+1}`,plan:{...plan}};}
 async submitTransaction(transaction:PreparedTransaction){const {plan}=transaction,from=this.account(plan.from,plan.currency,plan.network);if(from.balanceAtomic<plan.amountAtomic+plan.feeAtomic)throw new Error('MOCK_WALLET_INSUFFICIENT_BALANCE');from.balanceAtomic-=plan.amountAtomic+plan.feeAtomic;const recipient=this.accounts.get(this.accountKey(plan.to,plan.currency,plan.network));if(recipient)recipient.balanceAtomic+=plan.amountAtomic;const transactionId=`sim-tx-${++this.sequence}`;this.transactions.set(transactionId,{plan:{...plan},state:'submitted',confirmationId:`sim-slot-${this.sequence}`});return {transactionId};}
 async confirmTransaction(transactionId:string,network:string):Promise<Confirmation>{const row=this.transactions.get(transactionId);if(!row||row.plan.network!==network)throw new Error('MOCK_TRANSACTION_NOT_FOUND');if(this.autoConfirm)row.state='confirmed';return {transactionId,confirmationId:row.confirmationId,network,confirmed:row.state==='confirmed',mode:this.mode};}
 async verifyTransaction(confirmation:Confirmation,expected:TransferPlan){const row=this.transactions.get(confirmation.transactionId);return this.mode==='SIMULATED'&&confirmation.mode==='SIMULATED'&&Boolean(row)&&row!.state==='confirmed'&&row!.confirmationId===confirmation.confirmationId&&row!.plan.agentId===expected.agentId&&row!.plan.from===expected.from&&row!.plan.to===expected.to&&row!.plan.amountAtomic===expected.amountAtomic&&row!.plan.feeAtomic===expected.feeAtomic&&row!.plan.currency===expected.currency&&row!.plan.network===expected.network&&row!.plan.action===expected.action&&row!.plan.subjectId===expected.subjectId;}
 get transactionCount(){return this.transactions.size;}
 private account(address:string,currency:string,network:string){const account=this.accounts.get(this.accountKey(address,currency,network));if(!account)throw new Error('MOCK_ACCOUNT_NOT_FOUND');return account;}
 private accountKey(address:string,currency:string,network:string){return `${address}:${currency}:${network}`;}
}
