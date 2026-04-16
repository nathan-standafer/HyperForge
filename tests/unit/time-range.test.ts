import { resolveRange, isoWeekOf } from '../../src/lib/time-range';

describe('resolveRange', () => {
  const now = new Date('2026-04-15T12:00:00Z');

  it('4w returns [now - 28 days, now]', () => {
    const { start, end } = resolveRange('4w', now);
    expect(end.getTime()).toBe(now.getTime());
    expect(end.getTime() - start.getTime()).toBe(28 * 24 * 60 * 60 * 1000);
  });

  it('3m subtracts 3 calendar months', () => {
    const { start } = resolveRange('3m', now);
    expect(start.getMonth()).toBe(0); // Jan (April - 3)
    expect(start.getFullYear()).toBe(2026);
  });

  it('6m subtracts 6 calendar months', () => {
    const { start } = resolveRange('6m', now);
    expect(start.getMonth()).toBe(9); // Oct (April - 6, prior year)
    expect(start.getFullYear()).toBe(2025);
  });

  it('1y subtracts one year', () => {
    const { start } = resolveRange('1y', now);
    expect(start.getFullYear()).toBe(2025);
    expect(start.getMonth()).toBe(now.getMonth());
  });

  it("all returns epoch as start", () => {
    const { start, end } = resolveRange('all', now);
    expect(start.getTime()).toBe(0);
    expect(end.getTime()).toBe(now.getTime());
  });
});

describe('isoWeekOf', () => {
  it('Monday returns same Monday at 00:00', () => {
    const monday = new Date('2026-04-13T10:30:00'); // local Monday
    const { start, end } = isoWeekOf(monday);
    expect(start.getDay()).toBe(1); // Monday
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    // end = Sunday 23:59:59.999
    expect(end.getDay()).toBe(0);
    expect(end.getHours()).toBe(23);
  });

  it('Sunday returns the preceding Monday', () => {
    const sunday = new Date('2026-04-19T10:30:00'); // local Sunday
    const { start } = isoWeekOf(sunday);
    expect(start.getDay()).toBe(1);
    expect(start.getDate()).toBe(13);
  });

  it('window covers exactly 7 days', () => {
    const { start, end } = isoWeekOf(new Date('2026-04-15T12:00:00'));
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000 - 1);
  });
});
