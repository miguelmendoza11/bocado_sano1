import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutritionService } from '../../core/services/nutrition.service';
import { RecipeService } from '../../core/services/recipe.service';
import { CalorieRing } from '../../shared/calorie-ring/calorie-ring';

@Component({
  selector: 'app-receta-detalle',
  imports: [RouterLink, TitleCasePipe, CalorieRing],
  templateUrl: './receta-detalle.html',
  styleUrl: './receta-detalle.scss',
})
export class RecetaDetalle {
  private readonly recipeService = inject(RecipeService);
  protected readonly nutrition = inject(NutritionService);

  /** Viene de la URL /recetas/:id gracias a withComponentInputBinding(). */
  readonly id = input.required({ transform: numberAttribute });

  /** La receta de la URL, o undefined si el id no existe. */
  protected readonly recipe = computed(() => this.recipeService.getById(this.id()));

  /** Porcentaje de la meta diaria de kcal que aporta una porción. */
  protected readonly goalPct = computed(() => {
    const r = this.recipe();
    return r ? Math.round((r.kcal / this.nutrition.calorieGoal()) * 100) : 0;
  });

  /** Filas de macros con su porcentaje frente a la meta diaria (para las barras). */
  protected readonly macros = computed(() => {
    const r = this.recipe();
    if (!r) return [];
    const goal = this.nutrition.macroGoals();
    return [
      { label: 'Proteínas', grams: r.macros.protein, goal: goal.protein, colorClass: 'bar-protein' },
      { label: 'Carbohidratos', grams: r.macros.carbs, goal: goal.carbs, colorClass: 'bar-carbs' },
      { label: 'Grasas', grams: r.macros.fat, goal: goal.fat, colorClass: 'bar-fat' },
    ].map((m) => ({ ...m, pct: Math.min((m.grams / m.goal) * 100, 100) }));
  });
}
