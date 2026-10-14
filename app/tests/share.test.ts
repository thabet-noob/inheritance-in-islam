import { describe, expect, it } from 'vitest';
import { decodeScenario, encodeScenario, Scenario } from '../src/ui/share';

describe('share links', () => {
  const sc: Scenario = { g: 'male', e: '1,000,000', c: 'AED', b: '100,000', h: { Wife: 1, Son: 1, Daughter: 2 }, l: 'ar' };

  it('round-trips a scenario through the URL hash', () => {
    expect(decodeScenario(`#s=${encodeScenario(sc)}`)).toEqual(sc);
  });

  it('carries no names', () => {
    expect(JSON.stringify(decodeScenario(`#s=${encodeScenario(sc)}`))).not.toMatch(/name/i);
  });

  it('rejects malformed or hostile input', () => {
    expect(decodeScenario('#s=not-base64!!')).toBeNull();
    expect(decodeScenario('#nothing')).toBeNull();
    const bad = encodeScenario({ ...sc, h: { Wife: 1, Hacker: 3, Son: -2, Daughter: 1e9 } as never });
    expect(decodeScenario(`#s=${bad}`)?.h).toEqual({ Wife: 1 });
  });
});
