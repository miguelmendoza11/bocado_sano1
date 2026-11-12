import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { DayHistory } from '../../core/models/nutrition.models';
import { NutritionService } from '../../core/services/nutrition.service';

/** Suma días a una fecha ISO ("2026-11-10" + 1 → "2026-11-11") sin líos de zona horaria. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-progreso',
  imports: [DecimalPipe, DatePipe],
  templateUrl: './progreso.html',
  styleUrl: './progreso.scss',
})
export class Progreso {
  protected readonly nutrition = inject(NutritionService);

  /**
   * Los 7 días de la semana: el historial + HOY.
   * Hoy es el día siguiente al último del historial, y sus kcal son las del Diario,
   * así que esta lista cambia en vivo cuando agregas o quitas comida.
   */
  readonly week = computed<DayHistory[]>(() => {
    const history = this.nutrition.weekHistory();
    const last = history.at(-1)?.date;
    const today = last ? addDays(last, 1) : new Date().toISOString().slice(0, 10);
    return [...history, { date: today, kcal: this.nutrition.consumedKcal() }];
  });

  /** Promedio diario de kcal de la semana (redondeado). */
  readonly average = computed(() => {
    const days = this.week();
    return Math.round(days.reduce((sum, d) => sum + d.kcal, 0) / days.length);
  });

  /** Cuántos días quedaron en la meta o por debajo. */
  readonly daysOnGoal = computed(
    () => this.week().filter((d) => d.kcal <= this.nutrition.calorieGoal()).length,
  );

  /** Primer registro de peso (punto de partida). */
  readonly firstWeight = computed(() => this.nutrition.weightHistory().at(0));

  /** Cambio de peso desde el primer registro (negativo = bajó), con 1 decimal. */
  readonly totalWeightChange = computed(() => {
    const first = this.firstWeight();
    if (!first) return 0;
    return Math.round((this.nutrition.currentWeight() - first.kg) * 10) / 10;
  });
}
