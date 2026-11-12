import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MealType } from '../../core/models/nutrition.models';
import { NutritionService } from '../../core/services/nutrition.service';

@Component({
  selector: 'app-diario',
  imports: [DecimalPipe],
  templateUrl: './diario.html',
  styleUrl: './diario.scss',
})
export class Diario {
  protected readonly nutrition = inject(NutritionService);

  /** Comida elegida en las pestañas del buscador. */
  protected readonly selectedMeal = signal<MealType>('desayuno');

  /** Porcentaje de la meta ya consumido (0–100) para la barra del resumen. */
  protected readonly percent = computed(() =>
    Math.min((this.nutrition.consumedKcal() / this.nutrition.calorieGoal()) * 100, 100),
  );
}
