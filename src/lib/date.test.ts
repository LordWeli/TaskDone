import { addDays, daysBetween, msUntilNextDay, toDayKey } from './date';

describe('date helpers', () => {
  it('formats the local day with zero padding', () => {
    expect(toDayKey(new Date(2026, 0, 5, 9, 30))).toBe('2026-01-05');
  });

  it('uses local time right before and after midnight', () => {
    expect(toDayKey(new Date(2026, 10, 9, 23, 59, 59, 999))).toBe('2026-11-09');
    expect(toDayKey(new Date(2026, 10, 10, 0, 0, 0, 0))).toBe('2026-11-10');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('counts calendar days between two days', () => {
    expect(daysBetween('2026-11-09', '2026-11-09')).toBe(0);
    expect(daysBetween('2026-11-09', '2026-11-10')).toBe(1);
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3);
    expect(daysBetween('2026-11-10', '2026-11-09')).toBe(-1);
  });

  it('computes time until next local midnight', () => {
    const now = new Date(2026, 10, 9, 23, 0, 0, 0).getTime();
    expect(msUntilNextDay(now)).toBe(60 * 60 * 1000);
  });

  it('rejects malformed day keys', () => {
    expect(() => addDays('nope', 1)).toThrow();
  });
});
