/** Portable unsigned 32-bit FNV-1a + xorshift. Persist the seed, never a clock. */
export function hashSeed(seed: string): number {
  let value = 2166136261;
  for (const char of seed) { value ^= char.charCodeAt(0); value = Math.imul(value, 16777619); }
  return value >>> 0 || 1;
}
export function rng(seed: string) {
  let value = hashSeed(seed);
  const next = () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return (value >>> 0) / 4294967296; };
  return {
    next,
    int(min: number, max: number) { return min + Math.floor(next() * (max - min + 1)); },
    pick<T>(items: readonly T[]): T { if (!items.length) throw new Error('EMPTY_POOL'); return items[Math.floor(next() * items.length)]; },
    shuffle<T>(items: readonly T[]): T[] { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
  };
}
