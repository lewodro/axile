import { expect,it } from 'vitest';
import { hashKey,keyMatches } from '@axile/db';
it('hashes keys and compares without plaintext storage',()=>{const key='ax_secret';expect(hashKey(key)).not.toContain(key);expect(keyMatches(key,hashKey(key))).toBe(true);expect(keyMatches('ax_other',hashKey(key))).toBe(false);});
