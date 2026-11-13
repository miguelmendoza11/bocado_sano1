import { NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, numberAttribute } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MealType } from '../../core/models/nutrition.models';
import { NutritionService } from '../../core/services/nutrition.service';
import { RecipeService } from '../../core/services/recipe.service';
import { CalorieRing } from '../../shared/calorie-ring/calorie-ring';

@Component({
  selector: 'app-receta-detalle',
  imports: [RouterLink, TitleCasePipe, CalorieRing, NgOptimizedImage],
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

  /** true si la foto no cargó (se muestra el emoji). Vuelve a false al abrir otra receta. */
  protected readonly imageFailed = linkedSignal(() => {
    this.recipe();
    return false;
  });

  /** Porcentaje de la meta diaria de kcal que aporta una porción. */
  protected readonly goalPct = computed(() => {
    const r = this.recipe();
    return r ? Math.round((r.kcal / this.nutrition.calorieGoal()) * 100) : 0;
  });

  // ---------- Agregar al diario ----------

  protected readonly minServings = 1;
  protected readonly maxServings = 12;

  /**
   * Comida elegida. Empieza en la categoría de la receta y vuelve a ella si se abre otra receta
   * (linkedSignal: se puede cambiar con set(), pero se reinicia cuando cambia la receta).
   */
  protected readonly selectedMeal = linkedSignal<MealType>(() => this.recipe()?.category ?? 'desayuno');

  /** Porciones que se van a registrar (empieza en 1 con cada receta). */
  protected readonly servings = linkedSignal(() => {
    this.recipe();
    return 1;
  });

  /** Confirmación después de agregar (se borra al abrir otra receta). */
  protected readonly added = linkedSignal<{ message: string; meal: MealType } | null>(() => {
    this.recipe();
    return null;
  });

  protected changeServings(delta: number): void {
    this.servings.update((n) => Math.min(Math.max(n + delta, this.minServings), this.maxServings));
  }

  protected addToDiary(): void {
    const r = this.recipe();
    if (!r) return;
    const meal = this.selectedMeal();
    const servings = this.servings();
    this.nutrition.addRecipe(r.id, meal, servings);

    const label = this.nutrition.meals.find((m) => m.type === meal)?.label ?? meal;
    const portions = servings === 1 ? '1 porción' : `${servings} porciones`;
    this.added.set({ message: `${r.name} (${portions}) agregado a ${label}.`, meal });
  }

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
