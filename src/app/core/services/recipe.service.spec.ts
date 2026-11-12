import { TestBed } from '@angular/core/testing';
import { RecipeService } from './recipe.service';

describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecipeService);
  });

  it('has 8 sample recipes with unique ids', () => {
    const ids = service.recipes().map((r) => r.id);
    expect(ids.length).toBe(8);
    expect(new Set(ids).size).toBe(8);
  });

  it('has at least one recipe for each meal', () => {
    const categories = new Set(service.recipes().map((r) => r.category));
    expect([...categories].sort()).toEqual(['almuerzo', 'cena', 'desayuno', 'snacks']);
  });

  it('finds a recipe by id', () => {
    expect(service.getById(3)?.name).toBe('Ensalada de quinoa y aguacate');
  });

  it('returns undefined for an unknown id', () => {
    expect(service.getById(999)).toBeUndefined();
  });

  it('has kcal that match the macros (4·P + 4·C + 9·G, ±10 kcal)', () => {
    for (const r of service.recipes()) {
      const fromMacros = 4 * r.macros.protein + 4 * r.macros.carbs + 9 * r.macros.fat;
      expect(Math.abs(fromMacros - r.kcal)).toBeLessThanOrEqual(10);
    }
  });

  it('returns every recipe with no search and "todas"', () => {
    expect(service.filter('', 'todas').length).toBe(8);
  });

  it('filters by category', () => {
    const result = service.filter('', 'desayuno');
    expect(result.length).toBe(2);
    expect(result.every((r) => r.category === 'desayuno')).toBe(true);
  });

  it('searches by name ignoring case and accents', () => {
    expect(service.filter('SALMON', 'todas').map((r) => r.id)).toEqual([5]);
  });

  it('searches by tag', () => {
    const ids = service.filter('vegana', 'todas').map((r) => r.id);
    expect(ids).toEqual([3, 7, 8]);
  });

  it('combines search and category', () => {
    expect(service.filter('vegana', 'snacks').map((r) => r.id)).toEqual([7, 8]);
    expect(service.filter('pollo', 'cena')).toEqual([]);
  });

  it('has ingredients and steps in every recipe', () => {
    for (const r of service.recipes()) {
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
    }
  });
});
