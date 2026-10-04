import { z } from 'zod';
import { rng } from '@axile/engines';
import type { AgentProvider, AgentPrompt, AgentDecision } from '@axile/core';

const decisionSchema = z.object({
  move: z.string().trim().min(1).max(80),
  reason: z.string().trim().min(1).max(1000),
}).strict();

const chatEnvelopeSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().nullable() }),
  })).min(1),
});

export class ProviderError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'ProviderError';
  }
}

export class RandomProvider implements AgentProvider {
  async decide(prompt: AgentPrompt): Promise<AgentDecision> {
    if (prompt.legalMoves.length === 0) throw new ProviderError('NO_LEGAL_MOVES');
    return {
      move: rng(`random:${prompt.seedHint}`).pick(prompt.legalMoves),
      reason: 'A legal choice from a seeded baseline.',
    };
  }
}

export class LLMProvider implements AgentProvider {
  constructor(private readonly config: {
    url: string;
    apiKey: string;
    model: string;
    timeoutMs?: number;
    fetcher?: typeof fetch;
  }) {}

  async decide(prompt: AgentPrompt): Promise<AgentDecision> {
    if (!this.config.apiKey.trim() || !this.config.model.trim() || !this.config.url.trim()) {
      throw new ProviderError('LLM_NOT_CONFIGURED');
    }

    let response: Response;
    try {
      response = await (this.config.fetcher ?? fetch)(this.config.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: [
                'You are an autonomous agent living one life in Axile.',
                prompt.identity.personality ? `Your temperament: ${prompt.identity.personality}` : '',
                'Choose exactly one move from the legal move list.',
                'Reply only with JSON shaped as {"move":"...","reason":"..."}.',
                'Never invent game state. Keep the reason under 1000 characters.',
              ].filter(Boolean).join(' '),
            },
            {
              role: 'user',
              content: JSON.stringify({
                identity: { name: prompt.identity.name, role: prompt.role },
                age: prompt.age,
                stats: prompt.stats,
                game: prompt.game,
                gameState: prompt.gameState,
                legalMoves: prompt.legalMoves,
                recentHistory: prompt.recentHistory,
                turnIndex: prompt.turnIndex,
                moveIndex: prompt.moveIndex,
              }),
            },
          ],
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs ?? 12000),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new ProviderError('LLM_TIMEOUT');
      }
      throw new ProviderError('LLM_UNAVAILABLE');
    }

    if (response.status === 429) throw new ProviderError('LLM_RATE_LIMITED');
    if (response.status >= 500) throw new ProviderError('LLM_UNAVAILABLE');
    if (!response.ok) throw new ProviderError('LLM_API_ERROR');

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ProviderError('LLM_MALFORMED_JSON');
    }

    let candidate: unknown = body;
    if (typeof body === 'object' && body !== null && 'choices' in body) {
      const envelope = chatEnvelopeSchema.safeParse(body);
      if (!envelope.success) throw new ProviderError('LLM_EMPTY_RESPONSE');
      const content = envelope.data.choices[0]?.message.content?.trim();
      if (!content) throw new ProviderError('LLM_EMPTY_RESPONSE');
      try {
        candidate = JSON.parse(content);
      } catch {
        throw new ProviderError('LLM_MALFORMED_JSON');
      }
    }

    const parsed = decisionSchema.safeParse(candidate);
    if (!parsed.success) throw new ProviderError('LLM_MALFORMED_RESPONSE');
    if (!prompt.legalMoves.includes(parsed.data.move)) throw new ProviderError('LLM_INVALID_MOVE');
    return parsed.data;
  }
}

class UnavailableProvider implements AgentProvider {
  constructor(private readonly code: string) {}
  async decide(): Promise<AgentDecision> {
    throw new ProviderError(this.code);
  }
}

export function configuredProviderName(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.LLM_PROVIDER?.trim().toLowerCase();
  if (!configured || configured === 'random') return 'random';
  if (configured === 'openai' || configured === 'openai-compatible') return 'openai-compatible';
  return configured;
}

export function providerFromEnv(env: NodeJS.ProcessEnv = process.env): AgentProvider {
  const provider = configuredProviderName(env);
  if (provider === 'random') return new RandomProvider();
  if (provider !== 'openai-compatible') return new UnavailableProvider('LLM_PROVIDER_UNSUPPORTED');

  const apiKey = env.LLM_API_KEY?.trim() ?? '';
  const model = env.LLM_MODEL?.trim() ?? '';
  const url = env.LLM_API_URL?.trim() || 'https://api.openai.com/v1/chat/completions';
  if (!apiKey || !model) return new UnavailableProvider('LLM_NOT_CONFIGURED');
  const parsedUrl = URL.canParse(url) ? new URL(url) : null;
  if (!parsedUrl || parsedUrl.protocol !== 'https:') return new UnavailableProvider('LLM_CONFIGURATION_ERROR');

  const timeoutValue = Number(env.LLM_TIMEOUT_MS ?? 12000);
  const timeoutMs = Number.isInteger(timeoutValue) ? Math.min(60000, Math.max(500, timeoutValue)) : 12000;
  return new LLMProvider({ url, apiKey, model, timeoutMs });
}

export function llmFromEnv(env: NodeJS.ProcessEnv = process.env): LLMProvider {
  const provider = providerFromEnv(env);
  if (!(provider instanceof LLMProvider)) throw new ProviderError('LLM_NOT_CONFIGURED');
  return provider;
}
