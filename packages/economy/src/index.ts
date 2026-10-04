import { z } from 'zod';

export const EconomicIntentSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('ENTER_GAME'),gameId:z.string().min(1).max(64)}).strict(),
 z.object({action:z.literal('PAY_ENTRY_FEE'),gameId:z.string().min(1).max(64)}).strict(),
 z.object({action:z.literal('BUY_ACTION'),actionId:z.string().min(1).max(64)}).strict(),
 z.object({action:z.literal('CLAIM_REWARD'),rewardId:z.string().min(1).max(64)}).strict()
]);
export type EconomicIntent=z.infer<typeof EconomicIntentSchema>;
export type EconomicAction=EconomicIntent['action'];
export type ExecutionMode='SIMULATED'|'DEVNET'|'REAL';
export interface TransferPlan {agentId:string;from:string;to:string;amountAtomic:bigint;feeAtomic:bigint;currency:string;network:string;action:EconomicAction;subjectId:string;day:string}
export interface PreparedTransaction {reference:string;plan:TransferPlan}
export interface Confirmation {transactionId:string;confirmationId:string;network:string;confirmed:boolean;mode:ExecutionMode}
export interface WalletAdapter {
 readonly mode:ExecutionMode;
 getBalanceAtomic(address:string,currency:string,network:string):Promise<bigint>;
 estimateFeeAtomic(plan:TransferPlan):Promise<bigint>;
 prepareTransaction(plan:TransferPlan):Promise<PreparedTransaction>;
 submitTransaction(transaction:PreparedTransaction):Promise<{transactionId:string}>;
 confirmTransaction(transactionId:string,network:string):Promise<Confirmation>;
 verifyTransaction(confirmation:Confirmation,expected:TransferPlan):Promise<boolean>;
}
export interface EconomicLedger {reserveSpend(input:{agentId:string;day:string;currency:string;network:string;amountAtomic:bigint;maximumDailySpendAtomic:bigint}):Promise<string|null>;commitSpend(reservationId:string):Promise<void>;releaseSpend(reservationId:string):Promise<void>}
export interface EconomicActionRule {enabled:boolean;subjectIds:string[];amountAtomic:bigint;currency:string;network:string;destination:string}
export interface EconomicPolicy {allowedActions:EconomicAction[];rules:Partial<Record<EconomicAction,EconomicActionRule>>;approvedDestinations:string[];approvedNetworks:string[];maxTransactionAtomic:bigint;maxDailySpendAtomic:bigint;minimumReserveAtomic:bigint;maximumEntryFeeAtomic:bigint}
export interface EconomicContext {agentId:string;walletAddress:string;day?:string}
export interface EconomicStep {stage:'intent_received'|'policy_approved'|'transaction_prepared'|'transaction_submitted'|'confirmed'|'verified'|'entry_authorized';mode:ExecutionMode;details:Record<string,string|boolean>}
export interface VerifiedEconomicAction {mode:ExecutionMode;action:EconomicAction;subjectId:string;amountAtomic:string;currency:string;network:string;destination:string;transactionId:string;confirmationId:string;verified:true}
function subject(intent:EconomicIntent){return 'gameId' in intent?intent.gameId:'actionId' in intent?intent.actionId:intent.rewardId}
export async function executeEconomicIntent(input:unknown,context:EconomicContext,policy:EconomicPolicy,wallet:WalletAdapter,ledger:EconomicLedger,onStep?:(step:EconomicStep)=>void):Promise<VerifiedEconomicAction>{
 const intent=EconomicIntentSchema.parse(input);const emit=(stage:EconomicStep['stage'],details:Record<string,string|boolean>)=>onStep?.({stage,mode:wallet.mode,details});
 emit('intent_received',{action:intent.action,subjectId:subject(intent)});
 if(!policy.allowedActions.includes(intent.action))throw new Error('ACTION_NOT_ALLOWED');
 if(intent.action==='CLAIM_REWARD')throw new Error('ACTION_KIND_NOT_SUPPORTED');
 const rule=policy.rules[intent.action];if(!rule?.enabled)throw new Error('ACTION_DISABLED');
 if(!rule.subjectIds.includes(subject(intent)))throw new Error('SUBJECT_NOT_ALLOWED');
 if(!policy.approvedNetworks.includes(rule.network))throw new Error('NETWORK_NOT_ALLOWED');
 if(!policy.approvedDestinations.includes(rule.destination))throw new Error('DESTINATION_NOT_ALLOWED');
 if(rule.amountAtomic<=0n)throw new Error('INVALID_POLICY_AMOUNT');
 if(rule.amountAtomic>policy.maxTransactionAtomic)throw new Error('MAX_TRANSACTION_EXCEEDED');
 if((intent.action==='ENTER_GAME'||intent.action==='PAY_ENTRY_FEE')&&rule.amountAtomic>policy.maximumEntryFeeAtomic)throw new Error('MAX_ENTRY_FEE_EXCEEDED');
 const day=context.day??new Date().toISOString().slice(0,10);
 const draft:TransferPlan={agentId:context.agentId,from:context.walletAddress,to:rule.destination,amountAtomic:rule.amountAtomic,feeAtomic:0n,currency:rule.currency,network:rule.network,action:intent.action,subjectId:subject(intent),day};
 const feeAtomic=await wallet.estimateFeeAtomic(draft);if(feeAtomic<0n)throw new Error('INVALID_NETWORK_FEE');
 const plan={...draft,feeAtomic};
 if(rule.amountAtomic+feeAtomic>policy.maxTransactionAtomic)throw new Error('MAX_TRANSACTION_EXCEEDED');
 if((intent.action==='ENTER_GAME'||intent.action==='PAY_ENTRY_FEE')&&rule.amountAtomic+feeAtomic>policy.maximumEntryFeeAtomic)throw new Error('MAX_ENTRY_FEE_EXCEEDED');
 const balance=await wallet.getBalanceAtomic(context.walletAddress,rule.currency,rule.network);
 if(balance-rule.amountAtomic-feeAtomic<policy.minimumReserveAtomic)throw new Error('INSUFFICIENT_BALANCE_OR_RESERVE');
 const reservationId=await ledger.reserveSpend({agentId:context.agentId,day,currency:rule.currency,network:rule.network,amountAtomic:rule.amountAtomic+feeAtomic,maximumDailySpendAtomic:policy.maxDailySpendAtomic});
 if(!reservationId)throw new Error('DAILY_SPEND_EXCEEDED');
 let submitted=false;
 try{
 emit('policy_approved',{amountAtomic:rule.amountAtomic.toString(),feeAtomic:feeAtomic.toString(),network:rule.network,destination:rule.destination});
  const prepared=await wallet.prepareTransaction(plan);
  if(!samePlan(prepared.plan,plan))throw new Error('PREPARED_TRANSACTION_MISMATCH');
  emit('transaction_prepared',{reference:prepared.reference});
  submitted=true;const {transactionId}=await wallet.submitTransaction(prepared);await ledger.commitSpend(reservationId);emit('transaction_submitted',{transactionId});
  const confirmation=await wallet.confirmTransaction(transactionId,plan.network);
 if(confirmation.transactionId!==transactionId||confirmation.network!==plan.network||confirmation.mode!==wallet.mode||!confirmation.confirmed)throw new Error('TRANSACTION_NOT_CONFIRMED');
 emit('confirmed',{transactionId,confirmationId:confirmation.confirmationId});
 if(!await wallet.verifyTransaction(confirmation,plan))throw new Error('TRANSACTION_VERIFICATION_FAILED');
  emit('verified',{transactionId,mode:wallet.mode});
  return {mode:wallet.mode,action:intent.action,subjectId:plan.subjectId,amountAtomic:plan.amountAtomic.toString(),currency:plan.currency,network:plan.network,destination:plan.to,transactionId,confirmationId:confirmation.confirmationId,verified:true};
 }catch(error){if(!submitted)await ledger.releaseSpend(reservationId);throw error;}
}
export async function authorizeEntry<T>(input:unknown,context:EconomicContext,policy:EconomicPolicy,wallet:WalletAdapter,ledger:EconomicLedger,start:(receipt:VerifiedEconomicAction)=>Promise<T>,onStep?:(step:EconomicStep)=>void):Promise<{receipt:VerifiedEconomicAction;result:T}>{const receipt=await executeEconomicIntent(input,context,policy,wallet,ledger,onStep);if(!receipt.verified)throw new Error('ENTRY_NOT_VERIFIED');const result=await start(receipt);onStep?.({stage:'entry_authorized',mode:wallet.mode,details:{entryAuthorized:true,subjectId:receipt.subjectId}});return {receipt,result};}
function samePlan(a:TransferPlan,b:TransferPlan){return a.agentId===b.agentId&&a.from===b.from&&a.to===b.to&&a.amountAtomic===b.amountAtomic&&a.feeAtomic===b.feeAtomic&&a.currency===b.currency&&a.network===b.network&&a.action===b.action&&a.subjectId===b.subjectId&&a.day===b.day;}
