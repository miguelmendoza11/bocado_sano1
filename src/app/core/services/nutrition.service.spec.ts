import { TestBed } from '@angular/core/testing';
import { NutritionService, daysAgo } from './nutrition.service';

describe('NutritionService', () => {
  let service: NutritionService;

  beforeEach(() => {
    // Reloj fijo en el 11 de noviembre de 2026 (solo Date) para fechas predecibles
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
    TestBed.configureTestingModule({});
    service = TestBed.inject(NutritionService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates the sample history counting back from today', () => {
    expect(service.today).toBe('2026-11-11');
    expect(service.weekHistory().map((d) => d.date)).toEqual([
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
    ]);
    expect(service.weightHistory().at(0)?.date).toBe('2026-10-14');
    expect(service.weightHistory().at(-1)?.date).toBe('2026-11-11');
  });

  it('calculates the calorie goal with Mifflin-St Jeor', () => {
    // (10·72,4 + 6,25·175 − 5·24 + 5) × 1,55 − 500 ≈ 2139 → 2140
    expect(service.calorieGoal()).toBe(2140);
  });

  it('splits macros 50/25/25', () => {
    expect(service.macroGoals()).toEqual({ carbs: 268, protein: 134, fat: 59 });
  });

  it('adds up the calories of the sample entries', () => {
    expect(service.consumedKcal()).toBe(950);
    expect(service.kcalFor('desayuno')).toBe(420);
    expect(service.kcalFor('cena')).toBe(0);
  });

  it('calculates remaining calories including steps', () => {
    // 2140 − 950 + 262 (6540 pasos × 0,04)
    expect(service.remainingKcal()).toBe(1452);
  });

  it('updates totals when a food is added and removed', () => {
    service.addFood(7, 'snacks', 2);
    expect(service.kcalFor('snacks')).toBe(190);

    const added = service.entriesFor('snacks')[0];
    service.removeEntry(added.id);
    expect(service.kcalFor('snacks')).toBe(0);
  });

  it('never lets water go below zero', () => {
    service.addWater(-5000);
    expect(service.waterMl()).toBe(0);
  });

  it('reports the latest weight change', () => {
    expect(service.currentWeight()).toBe(72.4);
    expect(service.weightChange()).toBe(-0.6);
  });

  it('adds a weight for a new day and makes it the current weight', () => {
    expect(service.addWeight(72.04, '2026-11-18')).toBe(true);
    expect(service.weightHistory().length).toBe(6);
    expect(service.currentWeight()).toBe(72);
    expect(service.weightChange()).toBe(-0.4);
    expect(service.profile().weightKg).toBe(72);
  });

  it('replaces the weight when the day already has one', () => {
    service.addWeight(71.8, '2026-11-11');
    expect(service.weightHistory().length).toBe(5);
    expect(service.currentWeight()).toBe(71.8);
  });

  it('daysAgo uses the local date and crosses months and years', () => {
    expect(daysAgo(1, new Date(2026, 10, 1, 23, 30))).toBe('2026-10-31');
    expect(daysAgo(-1, new Date(2026, 11, 31, 8, 0))).toBe('2027-01-01');
  });

  it('keeps the weight history sorted by date', () => {
    service.addWeight(73.2, '2026-10-30');
    const dates = service.weightHistory().map((w) => w.date);
    expect(dates).toEqual([...dates].sort());
    expect(service.currentWeight()).toBe(72.4);
  });

  it('rejects impossible weights without changing anything', () => {
    expect(service.addWeight(0, '2026-11-18')).toBe(false);
    expect(service.addWeight(500, '2026-11-18')).toBe(false);
    expect(service.addWeight(Number.NaN, '2026-11-18')).toBe(false);
    expect(service.weightHistory().length).toBe(5);
  });

  it('recalculates the goal when the profile changes', () => {
    service.updateProfile({ goal: 'mantener' });
    expect(service.calorieGoal()).toBe(2640);
  });
});
