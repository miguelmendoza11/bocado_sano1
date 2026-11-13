import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import {
  NutritionService,
  SavedNutrition,
  dataKey,
  recipeAsFood,
  rollOver,
  shiftDate,
} from './nutrition.service';
import { RECIPES } from './recipe.service';

/**
 * Guardado en localStorage por usuario y cambio de día.
 * Reloj fijo en el miércoles 11 de noviembre de 2026 (solo se falsea Date).
 */
describe('NutritionService · persistencia', () => {
  const ANA = 'ana@correo.test';
  const PEDRO = 'pedro@correo.test';

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  /** Simula abrir la app (o recargar con F5): servicios nuevos que leen localStorage. */
  function openApp() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const auth = TestBed.inject(AuthService);
    const nutrition = TestBed.inject(NutritionService);
    TestBed.tick(); // ejecuta los effects: carga los datos del usuario con sesión
    return { auth, nutrition };
  }

  const saved = (email: string) =>
    JSON.parse(localStorage.getItem(dataKey(email)) ?? 'null') as SavedNutrition | null;

  it('saves the diary of the logged in user', () => {
    const { auth, nutrition } = openApp();
    auth.register('Ana', ANA);
    TestBed.tick();

    nutrition.addFood(7, 'snacks'); // manzana
    nutrition.addWater(500);
    TestBed.tick();

    const data = saved(ANA)!;
    expect(data.date).toBe('2026-11-11');
    expect(data.entries.some((e) => e.foodId === 7 && e.meal === 'snacks')).toBe(true);
    expect(data.waterMl).toBe(1750);
  });

  it('keeps the data after reloading the page', () => {
    const first = openApp();
    first.auth.register('Ana', ANA);
    TestBed.tick();
    first.nutrition.removeEntry(2); // café con leche
    first.nutrition.setSteps(9000);
    TestBed.tick();

    const { nutrition } = openApp(); // F5: la sesión sigue en localStorage
    expect(nutrition.consumedKcal()).toBe(850);
    expect(nutrition.steps()).toBe(9000);
  });

  it('gives a new user the sample data with their own name', () => {
    const { auth, nutrition } = openApp();
    auth.register('Pedro Pérez', PEDRO);
    TestBed.tick();

    expect(nutrition.profile().name).toBe('Pedro Pérez');
    expect(nutrition.consumedKcal()).toBe(950);
    expect(saved(PEDRO)).not.toBeNull();
  });

  it('does not mix the data of two users', () => {
    const { auth, nutrition } = openApp();
    auth.register('Ana', ANA);
    TestBed.tick();
    nutrition.addFood(9, 'cena'); // salmón 310
    TestBed.tick();

    auth.logout();
    auth.register('Pedro', PEDRO);
    TestBed.tick();
    expect(nutrition.kcalFor('cena')).toBe(0);

    auth.logout();
    auth.login(ANA);
    TestBed.tick();
    expect(nutrition.kcalFor('cena')).toBe(310);
  });

  it('ignores saved foods that are no longer in the catalog', () => {
    const { auth } = openApp();
    auth.register('Ana', ANA);
    TestBed.tick();
    const data = saved(ANA)!;
    data.entries.push({ id: 999, foodId: 12345, meal: 'cena', servings: 1 });
    localStorage.setItem(dataKey(ANA), JSON.stringify(data));

    const { nutrition } = openApp();
    expect(nutrition.entries().some((e) => e.id === 999)).toBe(false);
    expect(nutrition.consumedKcal()).toBe(950);
  });

  it('starts a new day when the saved data is from a previous day', () => {
    const first = openApp();
    first.auth.register('Ana', ANA);
    TestBed.tick();
    // Lo guardado pasa a ser del lunes 9 (950 kcal de comidas)
    const data = saved(ANA)!;
    localStorage.setItem(dataKey(ANA), JSON.stringify({ ...data, date: '2026-11-09' }));

    const { nutrition } = openApp();
    expect(nutrition.entries()).toEqual([]);
    expect(nutrition.waterMl()).toBe(0);
    expect(nutrition.weekHistory().slice(-2)).toEqual([
      { date: '2026-11-09', kcal: 950 },
      { date: '2026-11-10', kcal: 0 },
    ]);
  });

  it('resets to the sample data but keeps the name', () => {
    const { auth, nutrition } = openApp();
    auth.register('Ana', ANA);
    TestBed.tick();
    nutrition.removeEntry(1);
    nutrition.updateProfile({ age: 40 });
    TestBed.tick();

    nutrition.resetToSample();
    TestBed.tick();

    expect(nutrition.consumedKcal()).toBe(950);
    expect(nutrition.profile()).toEqual(expect.objectContaining({ name: 'Ana', age: 24 }));
    expect(saved(ANA)!.entries.length).toBe(5);
  });

  it('saves a recipe with its recipeId', () => {
    const { auth, nutrition } = openApp();
    auth.register('Ana', ANA);
    TestBed.tick();

    nutrition.addRecipe(1, 'desayuno', 2); // 2 porciones de pancakes (350 c/u)
    TestBed.tick();

    const entry = saved(ANA)!.entries.at(-1)!;
    expect(entry).toEqual(
      expect.objectContaining({ recipeId: 1, meal: 'desayuno', servings: 2 }),
    );
    expect(entry.foodId).toBeUndefined();
    expect(nutrition.kcalFor('desayuno')).toBe(420 + 700);
  });

  it('keeps a recipe after reloading the page', () => {
    const first = openApp();
    first.auth.register('Ana', ANA);
    TestBed.tick();
    first.nutrition.addRecipe(1, 'cena');
    TestBed.tick();

    const { nutrition } = openApp();
    const recipe = nutrition.entries().find((e) => e.recipeId === 1);
    // No se confunde con el alimento 1 (Avena con frutas): los ids se repiten
    expect(recipe?.food).toEqual(
      expect.objectContaining({ name: 'Pancakes de avena y banano', portion: '1 porción', kcal: 350 }),
    );
    expect(nutrition.consumedKcal()).toBe(950 + 350);
  });

  it('ignores saved recipes that are no longer in the catalog', () => {
    const { auth } = openApp();
    auth.register('Ana', ANA);
    TestBed.tick();
    const data = saved(ANA)!;
    data.entries.push({ id: 999, recipeId: 12345, meal: 'cena', servings: 1 });
    localStorage.setItem(dataKey(ANA), JSON.stringify(data));

    const { nutrition } = openApp();
    expect(nutrition.entries().some((e) => e.id === 999)).toBe(false);
    expect(nutrition.consumedKcal()).toBe(950);
  });
});

describe('recipeAsFood', () => {
  it('turns a recipe into a one-serving food', () => {
    const recipe = RECIPES.find((r) => r.id === 5)!;
    expect(recipeAsFood(recipe)).toEqual({
      id: 5,
      name: 'Salmón al horno con verduras',
      portion: '1 porción',
      kcal: 510,
      macros: { protein: 38, carbs: 22, fat: 30 },
    });
  });
});

describe('shiftDate', () => {
  it('moves forward and backward across months and years', () => {
    expect(shiftDate('2026-11-30', 1)).toBe('2026-12-01');
    expect(shiftDate('2027-01-01', -1)).toBe('2026-12-31');
    expect(shiftDate('2026-11-11', -6)).toBe('2026-11-05');
  });
});

describe('rollOver', () => {
  const base = (date: string, weekHistory: SavedNutrition['weekHistory']): SavedNutrition => ({
    version: 1,
    date,
    profile: {
      name: 'Ana',
      sex: 'mujer',
      age: 30,
      heightCm: 165,
      weightKg: 60,
      activity: 'ligero',
      goal: 'mantener',
    },
    entries: [{ id: 1, foodId: 7, meal: 'snacks', servings: 2 }], // 2 manzanas = 190 kcal
    waterMl: 800,
    steps: 4000,
    weightHistory: [],
    weekHistory,
    nextId: 2,
  });

  it('returns the same data when it is already today', () => {
    const data = base('2026-11-11', []);
    expect(rollOver(data, '2026-11-11')).toBe(data);
  });

  it('moves yesterday to the history and resets the day', () => {
    const result = rollOver(base('2026-11-10', [{ date: '2026-11-09', kcal: 1800 }]), '2026-11-11');
    expect(result.date).toBe('2026-11-11');
    expect(result.entries).toEqual([]);
    expect(result.waterMl).toBe(0);
    expect(result.steps).toBe(0);
    expect(result.weekHistory).toEqual([
      { date: '2026-11-09', kcal: 1800 },
      { date: '2026-11-10', kcal: 190 },
    ]);
  });

  it('fills the days without the app with 0 and keeps only the last 6 days', () => {
    const old = [1, 2, 3, 4, 5, 6].map((n) => ({ date: shiftDate('2026-11-01', n), kcal: 2000 }));
    const result = rollOver(base('2026-11-08', old), '2026-11-11');
    expect(result.weekHistory.map((d) => d.date)).toEqual([
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
    ]);
    expect(result.weekHistory.slice(-3).map((d) => d.kcal)).toEqual([190, 0, 0]);
  });

  it('also counts the kcal of recipes', () => {
    const data = base('2026-11-10', []);
    // 2 manzanas (190) + 1 porción de salmón al horno (510)
    data.entries.push({ id: 2, recipeId: 5, meal: 'cena', servings: 1 });
    const result = rollOver(data, '2026-11-11');
    expect(result.weekHistory).toEqual([{ date: '2026-11-10', kcal: 700 }]);
  });
});
