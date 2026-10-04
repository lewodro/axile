import { rng } from '@axile/engines';
import type { AgentProvider,AgentPrompt } from '@axile/core';
export class RandomProvider implements AgentProvider { async decide(prompt:AgentPrompt){return {move:rng(`random:${prompt.seedHint}`).pick(prompt.legalMoves),reason:'A legal choice from a seeded baseline.'};} }
