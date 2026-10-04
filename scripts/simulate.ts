import { createLife,runLife,type Role } from '@axile/core';
import { RandomProvider } from '@axile/providers';
const args=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split('=')));
const role=(args.role??'trader') as Role,seed=args.seed??'test-001';
if(!['trader','worker','family','wildcard'].includes(role))throw new Error('INVALID_ROLE');
if(args.provider&&args.provider!=='random')throw new Error('CLI_PROVIDER_UNAVAILABLE');
const life=createLife({id:'simulation',agent:{id:'baseline',name:'The Baseline',sprite:'baseline',provider:'random'},role,seed,now:'2000-01-01T00:00:00.000Z'});
const final=await runLife(life,new RandomProvider(),async(current,turn)=>{console.log(`TURN ${turn.index+1}  AGE ${turn.age}  ${turn.game.toUpperCase()}  ${turn.move}`);console.log(`  ${turn.reason} | ${JSON.stringify(turn.deltas)} | ${JSON.stringify(turn.statsAfter)}`);if(turn.completedGame)console.log(`  CHAPTER ENDED → AGE ${current.age}`);});
console.log(`FINAL SCORE ${final.score} | ${final.status} | age ${final.age} | bonus ${final.achievementBonus}`);
