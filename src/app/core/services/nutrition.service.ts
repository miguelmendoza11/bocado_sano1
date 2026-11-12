import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  ACTIVITY_LEVELS,
  DayHistory,
  Food,
  LoggedFood,
  Macros,
  MealInfo,
  MealType,
  UserProfile,
  WeightEntry,
} from '../models/nutrition.models';
import { STORAGE_PREFIX, readStorage, writeStorage } from '../utils/storage';
import { AuthService } from './auth.service';

/** Catálogo de alimentos de prueba (valores por porción). */
const FOODS: Food[] = [
  { id: 1, name: 'Avena con frutas', portion: '1 tazón', kcal: 320, macros: { protein: 10, carbs: 56, fat: 6 } },
  { id: 2, name: 'Café con leche', portion: '1 taza', kcal: 100, macros: { protein: 6, carbs: 10, fat: 4 } },
  { id: 3, name: 'Pechuga de pollo', portion: '150 g', kcal: 250, macros: { protein: 46, carbs: 0, fat: 6 } },
  { id: 4, name: 'Arroz integral', portion: '1 taza', kcal: 215, macros: { protein: 5, carbs: 45, fat: 2 } },
  { id: 5, name: 'Ensalada verde', portion: '1 plato', kcal: 65, macros: { protein: 2, carbs: 8, fat: 3 } },
  { id: 6, name: 'Huevo cocido', portion: '1 unidad', kcal: 78, macros: { protein: 6, carbs: 1, fat: 5 } },
  { id: 7, name: 'Manzana', portion: '1 mediana', kcal: 95, macros: { protein: 0, carbs: 25, fat: 0 } },
  { id: 8, name: 'Yogur griego', portion: '170 g', kcal: 150, macros: { protein: 15, carbs: 8, fat: 6 } },
  { id: 9, name: 'Salmón a la plancha', portion: '150 g', kcal: 310, macros: { protein: 34, carbs: 0, fat: 19 } },
  { id: 10, name: 'Pan integral', portion: '2 rebanadas', kcal: 160, macros: { protein: 8, carbs: 28, fat: 2 } },
];

const MEALS: MealInfo[] = [
  { type: 'desayuno', label: 'Desayuno', icon: 'bi-cup-hot', colorClass: 'bg-orange-soft' },
  { type: 'almuerzo', label: 'Almuerzo', icon: 'bi-sun', colorClass: 'bg-lime-soft' },
  { type: 'cena', label: 'Cena', icon: 'bi-moon-stars', colorClass: 'bg-blue-soft' },
  { type: 'snacks', label: 'Snacks', icon: 'bi-apple', colorClass: 'bg-orange-soft' },
];

/** Fecha ISO local ("2026-11-12") de hoy menos `days` días. Usa la hora local, no UTC. */
export function daysAgo(days: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Lo que se guarda en localStorage por cada usuario. */
export interface SavedNutrition {
  version: 1;
  /** Día al que pertenecen las comidas, el agua y los pasos. */
  date: string;
  profile: UserProfile;
  /** Solo el id del alimento: el resto se toma del catálogo al cargar. */
  entries: { id: number; foodId: number; meal: MealType; servings: number }[];
  waterMl: number;
  steps: number;
  weightHistory: WeightEntry[];
  weekHistory: DayHistory[];
  nextId: number;
}

/** Clave de localStorage de cada usuario: bocado-sano.data.ana@correo.com */
export const dataKey = (email: string) => `${STORAGE_PREFIX}data.${email}`;

/** Datos de ejemplo para alguien que entra por primera vez (con su nombre). */
function sampleData(name: string, today: string): SavedNutrition {
  return {
    version: 1,
    date: today,
    profile: {
      name,
      sex: 'hombre',
      age: 24,
      heightCm: 175,
      weightKg: 72.4,
      activity: 'moderado',
      goal: 'perder',
    },
    entries: [
      { id: 1, foodId: 1, meal: 'desayuno', servings: 1 },
      { id: 2, foodId: 2, meal: 'desayuno', servings: 1 },
      { id: 3, foodId: 3, meal: 'almuerzo', servings: 1 },
      { id: 4, foodId: 4, meal: 'almuerzo', servings: 1 },
      { id: 5, foodId: 5, meal: 'almuerzo', servings: 1 },
    ],
    waterMl: 1250,
    steps: 6540,
    // Un peso por semana durante 4 semanas; el último es de hoy
    weightHistory: [74.1, 73.6, 73.4, 73.0, 72.4].map((kg, i) => ({ date: daysAgo(28 - i * 7), kg })),
    // Los 6 días anteriores a hoy (hoy sale de las comidas del Diario)
    weekHistory: [2050, 1890, 2240, 1980, 2310, 2010].map((kcal, i) => ({ date: daysAgo(6 - i), kcal })),
    nextId: 100,
  };
}

/** Kcal que se quitan o suman a la meta según el objetivo. */
const GOAL_ADJUST = { perder: -500, mantener: 0, ganar: 300 } as const;

/**
 * Estado de la app con signals.
 * Se guarda en localStorage por usuario (no hay backend), así que sobrevive a un F5
 * y cada persona que inicia sesión en el mismo computador ve sus propios datos.
 */
@Injectable({ providedIn: 'root' })
export class NutritionService {
  // ---------- Datos fijos ----------
  readonly foods = FOODS;
  readonly meals = MEALS;
  readonly waterGoalMl = 2500;
  readonly stepsGoal = 10000;

  /** Fecha de hoy en formato ISO local. Los datos de prueba se generan a partir de ella. */
  readonly today = daysAgo(0);

  // ---------- Estado (signals) ----------
  // Empiezan con los datos de ejemplo; al haber sesión se cargan los del usuario.
  private readonly auth = inject(AuthService);
  private readonly sample = sampleData('Miguel', this.today);

  readonly profile = signal<UserProfile>(this.sample.profile);
  readonly entries = signal<LoggedFood[]>(this.toEntries(this.sample.entries));
  readonly waterMl = signal(this.sample.waterMl);
  readonly steps = signal(this.sample.steps);
  readonly weightHistory = signal<WeightEntry[]>(this.sample.weightHistory);
  readonly weekHistory = signal<DayHistory[]>(this.sample.weekHistory);

  private nextId = this.sample.nextId;

  /** Clave del usuario con sesión (null sin sesión). */
  private readonly storageKey = computed(() => {
    const email = this.auth.user()?.email;
    return email ? dataKey(email) : null;
  });

  /** Clave cuyos datos ya están cargados: evita guardar encima antes de cargar. */
  private loadedKey: string | null = null;

  constructor() {
    // 1) Cuando alguien inicia sesión (o cambia de usuario), se cargan sus datos
    effect(() => {
      const key = this.storageKey();
      if (!key) return;
      untracked(() => this.load(key));
    });

    // 2) Cada vez que cambia algo, se guarda para ese usuario
    effect(() => {
      const key = this.storageKey();
      const data = this.toSaved();
      if (key && key === this.loadedKey) writeStorage(key, data);
    });
  }

  // ---------- Metas calculadas ----------

  /** Meta diaria: Mifflin-St Jeor × actividad ± objetivo, redondeada a 10. */
  readonly calorieGoal = computed(() => {
    const p = this.profile();
    const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'hombre' ? 5 : -161);
    const total = base * ACTIVITY_LEVELS[p.activity] + GOAL_ADJUST[p.goal];
    return Math.round(total / 10) * 10;
  });

  /** Reparto 50% carbohidratos, 25% proteínas, 25% grasas (en gramos). */
  readonly macroGoals = computed<Macros>(() => {
    const kcal = this.calorieGoal();
    return {
      carbs: Math.round((kcal * 0.5) / 4),
      protein: Math.round((kcal * 0.25) / 4),
      fat: Math.round((kcal * 0.25) / 9),
    };
  });

  // ---------- Totales del día ----------

  readonly consumedKcal = computed(() =>
    this.entries().reduce((sum, e) => sum + e.food.kcal * e.servings, 0),
  );

  readonly consumedMacros = computed<Macros>(() =>
    this.entries().reduce(
      (sum, e) => ({
        protein: sum.protein + e.food.macros.protein * e.servings,
        carbs: sum.carbs + e.food.macros.carbs * e.servings,
        fat: sum.fat + e.food.macros.fat * e.servings,
      }),
      { protein: 0, carbs: 0, fat: 0 },
    ),
  );

  /** Estimación simple: 0,04 kcal por paso. */
  readonly burnedKcal = computed(() => Math.round(this.steps() * 0.04));

  /** Lo que queda: meta − consumidas + quemadas (nunca negativo). */
  readonly remainingKcal = computed(() =>
    Math.max(this.calorieGoal() - this.consumedKcal() + this.burnedKcal(), 0),
  );

  readonly currentWeight = computed(() => this.weightHistory().at(-1)?.kg ?? this.profile().weightKg);

  /** Diferencia con el registro de peso anterior (negativo = bajó). */
  readonly weightChange = computed(() => {
    const h = this.weightHistory();
    if (h.length < 2) return 0;
    return Math.round((h[h.length - 1].kg - h[h.length - 2].kg) * 10) / 10;
  });

  // ---------- Guardar / cargar ----------

  /** Todo el estado en el formato que se guarda (lee los signals: lo usa el effect). */
  private toSaved(): SavedNutrition {
    return {
      version: 1,
      date: this.today,
      profile: this.profile(),
      entries: this.entries().map((e) => ({ id: e.id, foodId: e.food.id, meal: e.meal, servings: e.servings })),
      waterMl: this.waterMl(),
      steps: this.steps(),
      weightHistory: this.weightHistory(),
      weekHistory: this.weekHistory(),
      nextId: this.nextId,
    };
  }

  /** Carga lo guardado del usuario; si es nuevo, le pone los datos de ejemplo con su nombre. */
  private load(key: string): void {
    const saved = readStorage<SavedNutrition>(key);
    const data =
      saved?.version === 1 ? saved : sampleData(this.auth.user()?.name ?? this.profile().name, this.today);

    this.profile.set(data.profile);
    this.entries.set(this.toEntries(data.entries));
    this.waterMl.set(data.waterMl);
    this.steps.set(data.steps);
    this.weightHistory.set(data.weightHistory);
    this.weekHistory.set(data.weekHistory);
    this.nextId = data.nextId;
    this.loadedKey = key;
  }

  /** Convierte lo guardado (ids) en registros con el alimento completo; ignora ids que ya no existen. */
  private toEntries(saved: SavedNutrition['entries']): LoggedFood[] {
    return saved.flatMap((e) => {
      const f = FOODS.find((x) => x.id === e.foodId);
      return f ? [{ id: e.id, food: f, meal: e.meal, servings: e.servings }] : [];
    });
  }

  // ---------- Consultas ----------

  entriesFor(meal: MealType): LoggedFood[] {
    return this.entries().filter((e) => e.meal === meal);
  }

  kcalFor(meal: MealType): number {
    return this.entriesFor(meal).reduce((sum, e) => sum + e.food.kcal * e.servings, 0);
  }

  // ---------- Acciones ----------

  addFood(foodId: number, meal: MealType, servings = 1): void {
    const f = FOODS.find((x) => x.id === foodId);
    if (!f || servings <= 0) return;
    this.entries.update((list) => [...list, { id: this.nextId++, food: f, meal, servings }]);
  }

  removeEntry(id: number): void {
    this.entries.update((list) => list.filter((e) => e.id !== id));
  }

  addWater(ml: number): void {
    this.waterMl.update((w) => Math.max(w + ml, 0));
  }

  setSteps(steps: number): void {
    this.steps.set(Math.max(Math.round(steps), 0));
  }

  updateProfile(changes: Partial<UserProfile>): void {
    this.profile.update((p) => ({ ...p, ...changes }));
  }

  /**
   * Registra el peso de un día (fecha ISO "2026-11-11").
   * Si ese día ya tenía peso lo reemplaza; si no, lo agrega en orden de fecha.
   * También actualiza el peso del perfil para que la meta de calorías se recalcule.
   * Devuelve false (y no cambia nada) si el peso no está entre 30 y 300 kg.
   */
  addWeight(kg: number, date: string): boolean {
    if (!Number.isFinite(kg) || kg < 30 || kg > 300) return false;
    const rounded = Math.round(kg * 10) / 10;
    this.weightHistory.update((list) =>
      [...list.filter((w) => w.date !== date), { date, kg: rounded }].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    );
    this.profile.update((p) => ({ ...p, weightKg: this.currentWeight() }));
    return true;
  }
}
