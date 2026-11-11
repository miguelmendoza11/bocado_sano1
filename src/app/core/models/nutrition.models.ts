/** Gramos de cada macronutriente. */
export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

/** Un alimento del catálogo (valores por porción). */
export interface Food {
  id: number;
  name: string;
  portion: string;
  kcal: number;
  macros: Macros;
}

export type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'snacks';

/** Datos fijos de cada comida del día (nombre e ícono). */
export interface MealInfo {
  type: MealType;
  label: string;
  icon: string;
  colorClass: string;
}

/** Un alimento que el usuario registró en una comida. */
export interface LoggedFood {
  id: number;
  food: Food;
  meal: MealType;
  servings: number;
}

export type Sex = 'hombre' | 'mujer';
export type Goal = 'perder' | 'mantener' | 'ganar';

/** Nivel de actividad → multiplicador de Mifflin-St Jeor. */
export const ACTIVITY_LEVELS = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_LEVELS;

export interface UserProfile {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
}

/** Resumen de un día para el historial. */
export interface DayHistory {
  date: string; // formato ISO: 2026-11-11
  kcal: number;
}

/** Un registro de peso. */
export interface WeightEntry {
  date: string;
  kg: number;
}
