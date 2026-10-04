import { describe, expect, it } from 'vitest';
import { rng } from '@axile/engines';
describe('seed stream', () => {
  it('repeats and remains bounded', () => {
    const a = rng('birth'), b = rng('birth');
    for (let i = 0; i < 1000; i++) { const value = a.next(); expect(value).toBe(b.next()); expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThan(1); }
  });
  it('shuffles without losing cards', () => { expect(rng('deck').shuffle([1,2,3,4]).sort()).toEqual([1,2,3,4]); });
});
