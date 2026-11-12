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

  it('has ingredients and steps in every recipe', () => {
    for (const r of service.recipes()) {
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
    }
  });
});
