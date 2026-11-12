import { Macros, MealType } from './nutrition.models';

/** Una receta del catálogo (valores por porción). */
export interface Recipe {
  id: number;
  name: string;
  description: string;
  /** Emoji que hace de "foto" de la receta. */
  emoji: string;
  /** Clase de fondo global: bg-lime-soft, bg-orange-soft o bg-blue-soft. */
  colorClass: string;
  /** Comida del día a la que pertenece (sirve para filtrar). */
  category: MealType;
  kcal: number;
  minutes: number;
  servings: number;
  macros: Macros;
  tags: string[];
  ingredients: string[];
  steps: string[];
}

/** Categoría elegida en el filtro de recetas: una comida o todas. */
export type RecipeCategoryFilter = MealType | 'todas';
