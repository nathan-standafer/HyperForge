import { estimateOneRm } from '../../src/lib/one-rm';

describe('estimateOneRm (Epley)', () => {
  it('computes 1RM for weight × (1 + reps/30)', () => {
    expect(estimateOneRm(100, 1)).toBeCloseTo(103.33, 2);
    expect(estimateOneRm(100, 5)).toBeCloseTo(116.67, 2);
    expect(estimateOneRm(100, 10)).toBeCloseTo(133.33, 2);
  });

  it('rounds to two decimals', () => {
    const val = estimateOneRm(80, 7);
    expect(val).not.toBeNull();
    const str = val!.toFixed(10);
    expect(Number(str.split('.')[1].slice(2).replace(/0+$/, ''))).toBe(0);
  });

  it('returns null for bodyweight (weight <= 0)', () => {
    expect(estimateOneRm(0, 10)).toBeNull();
    expect(estimateOneRm(-5, 10)).toBeNull();
  });

  it('returns null for reps < 1', () => {
    expect(estimateOneRm(100, 0)).toBeNull();
    expect(estimateOneRm(100, -1)).toBeNull();
  });
});
