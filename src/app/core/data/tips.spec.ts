import { TIPS, tipIndexFor } from './tips';

describe('TIPS', () => {
  it('has about 20 short tips with an icon and a category', () => {
    expect(TIPS.length).toBeGreaterThanOrEqual(20);
    for (const tip of TIPS) {
      expect(tip.text.length).toBeLessThanOrEqual(110);
      expect(tip.icon).toMatch(/^bi-[a-z0-9-]+$/);
      expect(['agua', 'comida', 'movimiento', 'descanso']).toContain(tip.category);
    }
  });

  it('has no repeated tips', () => {
    expect(new Set(TIPS.map((t) => t.text)).size).toBe(TIPS.length);
  });
});

describe('tipIndexFor', () => {
  const total = 20;
  const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m, d, h, min);

  it('gives the same tip during the whole day (local time)', () => {
    const morning = tipIndexFor(at(2026, 10, 16, 0, 0), total);
    expect(tipIndexFor(at(2026, 10, 16, 12, 30), total)).toBe(morning);
    expect(tipIndexFor(at(2026, 10, 16, 23, 59), total)).toBe(morning);
  });

  it('gives the next tip the next day', () => {
    const today = tipIndexFor(at(2026, 10, 16, 23, 59), total);
    expect(tipIndexFor(at(2026, 10, 17, 0, 0), total)).toBe((today + 1) % total);
  });

  it('also changes when the month and the year change', () => {
    const endOfMonth = tipIndexFor(at(2026, 10, 30), total); // 30 de noviembre
    expect(tipIndexFor(at(2026, 11, 1), total)).toBe((endOfMonth + 1) % total); // 1 de diciembre

    const endOfYear = tipIndexFor(at(2026, 11, 31), total);
    expect(tipIndexFor(at(2027, 0, 1), total)).toBe((endOfYear + 1) % total);
  });

  it('starts at 0 on the fixed start day and wraps around', () => {
    expect(tipIndexFor(at(2026, 0, 1), total)).toBe(0);
    expect(tipIndexFor(at(2026, 0, 21), total)).toBe(0); // 20 días después
  });

  it('always returns a valid index, even for old dates', () => {
    for (const date of [at(2025, 11, 31), at(2020, 5, 15), at(2030, 2, 3)]) {
      const index = tipIndexFor(date, total);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(total);
    }
    expect(tipIndexFor(at(2025, 11, 31), total)).toBe(total - 1); // el día antes del inicio
  });
});
