import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MealType } from '../../core/models/nutrition.models';
import { NutritionService } from '../../core/services/nutrition.service';
import { CalorieRing } from '../../shared/calorie-ring/calorie-ring';
import { RemindersBell } from '../../shared/reminders-bell/reminders-bell';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';

@Component({
  selector: 'app-inicio',
  imports: [CalorieRing, DecimalPipe, DatePipe, RouterLink, ThemeToggle, RemindersBell],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  protected readonly nutrition = inject(NutritionService);

  protected readonly today = new Date();

  /** Porcentaje de la meta ya consumido (0–100). */
  protected readonly percent = computed(() =>
    Math.round((this.nutrition.consumedKcal() / this.nutrition.calorieGoal()) * 100),
  );

  /** Avance de agua y pasos (0–100) para las barras. */
  protected readonly waterPct = computed(() =>
    Math.min((this.nutrition.waterMl() / this.nutrition.waterGoalMl) * 100, 100),
  );
  protected readonly stepsPct = computed(() =>
    Math.min((this.nutrition.steps() / this.nutrition.stepsGoal) * 100, 100),
  );

  /** Filas de la tarjeta de macros. */
  protected readonly macros = computed(() => {
    const done = this.nutrition.consumedMacros();
    const goal = this.nutrition.macroGoals();
    return [
      { label: 'Proteínas', done: done.protein, goal: goal.protein },
      { label: 'Carbohidratos', done: done.carbs, goal: goal.carbs },
      { label: 'Grasas', done: done.fat, goal: goal.fat },
    ].map((m) => ({ ...m, pct: Math.min((m.done / m.goal) * 100, 100) }));
  });

  /** Texto corto con lo que se comió, o "Sin registrar". */
  protected summary(meal: MealType): string {
    const names = this.nutrition.entriesFor(meal).map((e) => e.food.name);
    return names.length ? names.join(', ') : 'Sin registrar';
  }
}
