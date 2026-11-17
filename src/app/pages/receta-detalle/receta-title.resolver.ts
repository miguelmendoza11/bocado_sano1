import { inject, numberAttribute } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { RecipeService } from '../../core/services/recipe.service';

/**
 * Título de la pestaña para /recetas/:id.
 * Angular lo vuelve a calcular cada vez que cambia el :id, así que el título
 * siempre muestra la receta abierta: "Ensalada de quinoa y aguacate · Bocado Sano".
 * Usa la misma conversión que el componente (numberAttribute: "abc" → NaN → no existe).
 */
export const recipeTitle: ResolveFn<string> = (route) => {
  const id = numberAttribute(route.paramMap.get('id'));
  const recipe = inject(RecipeService).getById(id);
  return `${recipe?.name ?? 'Receta no encontrada'} · Bocado Sano`;
};
