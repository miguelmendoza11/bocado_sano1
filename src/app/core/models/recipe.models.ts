import { Macros, MealType } from './nutrition.models';

/** Una receta del catálogo (valores por porción). */
export interface Recipe {
  id: number;
  name: string;
  description: string;
  /** Foto de la receta, dentro de public/ (ej. 'recetas/crema-ahuyama.jpg'). */
  image: string;
  /** Qué se ve en la foto, para lectores de pantalla. */
  imageAlt: string;
  /** Parte de la foto que se deja ver al recortarla (object-position). Útil en fotos verticales. */
  imagePosition?: string;
  /** Respaldo: se muestra si la foto no carga. */
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
