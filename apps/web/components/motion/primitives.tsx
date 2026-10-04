'use client';
import { AnimatePresence,motion,useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

const easing=[0.22,1,0.36,1] as const;
export function PageReveal({children,className='',delay=0}:{children:ReactNode;className?:string;delay?:number}){
 const reduce=useReducedMotion();return <motion.div className={className} initial={reduce?false:{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:reduce?0:.55,delay:reduce?0:delay,ease:easing}}>{children}</motion.div>;
}
export function SectionReveal({children,className='',delay=0}:{children:ReactNode;className?:string;delay?:number}){
 const reduce=useReducedMotion();return <motion.section className={className} initial={reduce?false:{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.18}} transition={{duration:reduce?0:.65,delay:reduce?0:delay,ease:easing}}>{children}</motion.section>;
}
export function AgentThinking({label='AN AGENT IS THINKING.'}:{label?:string}){
 const reduce=useReducedMotion();return <span className="thinking" role="status" aria-live="polite">{label} {!reduce&&[0,1,2].map(index=><motion.i key={index} aria-hidden="true" animate={{opacity:[.25,1,.25]}} transition={{duration:1.1,delay:index*.16,repeat:Infinity}}/> )}</span>;
}
export function DecisionReveal({children,identity}:{children:ReactNode;identity:string}){
 const reduce=useReducedMotion();return <AnimatePresence mode="wait"><motion.div key={identity} initial={reduce?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={reduce?undefined:{opacity:0,y:-5}} transition={{duration:reduce?0:.28,ease:easing}}>{children}</motion.div></AnimatePresence>;
}
export function NumberTransition({value,className=''}:{value:number|string;className?:string}){
 const reduce=useReducedMotion();return <AnimatePresence mode="wait" initial={false}><motion.span key={String(value)} className={className} initial={reduce?false:{opacity:0,y:7}} animate={{opacity:1,y:0}} exit={reduce?undefined:{opacity:0,y:-5}} transition={{duration:reduce?0:.24}}>{value}</motion.span></AnimatePresence>;
}
export function StatChange({label,value,previous}:{label:string;value:number;previous?:number}){
 const reduce=useReducedMotion(),delta=previous===undefined?0:value-previous;return <div className="stat-item"><div className="stat-head"><span>{label.toUpperCase()}</span><NumberTransition value={value}/></div><div className="stat-track"><motion.div className="stat-fill" initial={false} animate={{width:`${value}%`}} transition={{duration:reduce?0:.5,ease:easing}}/></div><div className={`stat-delta${delta<0?' negative':''}`} aria-live="polite">{delta?<NumberTransition value={`${delta>0?'+':''}${delta}`}/>:<span aria-hidden="true">&nbsp;</span>}</div></div>;
}
export function AgeProgression({age}:{age:number}){const reduce=useReducedMotion();return <span className="fine age-progression" aria-live="polite">AGE <AnimatePresence mode="wait" initial={false}><motion.strong key={age} initial={reduce?false:{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={reduce?undefined:{opacity:0,y:-5}} transition={{duration:reduce?0:.22}}>{age}</motion.strong></AnimatePresence></span>}
export function GameResolution({children,identity}:{children:ReactNode;identity:string}){const reduce=useReducedMotion();return <AnimatePresence mode="wait"><motion.pre key={identity} className="game-state" initial={reduce?false:{opacity:.45}} animate={{opacity:1}} exit={reduce?undefined:{opacity:0}} transition={{duration:reduce?0:.24}}>{children}</motion.pre></AnimatePresence>}
export function DeathSequence({children}:{children:ReactNode}){const reduce=useReducedMotion();return <motion.section className="death-sequence" role="status" initial={reduce?false:{opacity:0}} animate={{opacity:1}} transition={{duration:reduce?0:.85}}>{children}</motion.section>}
export function LeaderboardRow({children,index}:{children:ReactNode;index:number}){const reduce=useReducedMotion();return <motion.tr initial={reduce?false:{opacity:0,y:7}} animate={{opacity:1,y:0}} transition={{duration:reduce?0:.3,delay:reduce?0:Math.min(index*.025,.3)}}>{children}</motion.tr>}
