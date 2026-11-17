import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MealType } from '../../core/models/nutrition.models';
import { ConfettiService } from '../../core/services/confetti.service';
import { NutritionService } from '../../core/services/nutrition.service';
import { ToastService } from '../../core/services/toast.service';
import { greetingFor, greetingText } from '../../core/utils/greeting';
import { CalorieRing } from '../../shared/calorie-ring/calorie-ring';
import { DailyTip } from '../../shared/daily-tip/daily-tip';
import { RemindersBell } from '../../shared/reminders-bell/reminders-bell';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';
import { WaterGlass } from '../../shared/water-glass/water-glass';

@Component({
  selector: 'app-inicio',
  imports: [
    CalorieRing,
    DailyTip,
    DecimalPipe,
    DatePipe,
    RouterLink,
    ThemeToggle,
    RemindersBell,
    WaterGlass,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {
  protected readonly nutrition = inject(NutritionService);
  private readonly confetti = inject(ConfettiService);
  private readonly toast = inject(ToastService);

  /**
   * Hora actual (del computador). Se actualiza cada minuto, así el saludo y la fecha
   * cambian solos (por ejemplo a las 12:00 pasa a "Buenas tardes").
   */
  protected readonly now = signal(new Date());

  /** "Buenos días" + ícono, según la hora. */
  protected readonly greeting = computed(() => greetingFor(this.now().getHours()));

  /** "Buenos días, Juan": solo el primer nombre del perfil. */
  protected readonly greetingTitle = computed(() =>
    greetingText(this.now().getHours(), this.nutrition.profile().name),
  );

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Porcentaje de la meta ya consumido (0–100). */
  protected readonly percent = computed(() =>
    Math.round((this.nutrition.consumedKcal() / this.nutrition.calorieGoal()) * 100),
  );

  /** Avance de agua (0–100, para el vaso) y de pasos (0–100, para la barra). */
  protected readonly waterPct = computed(() =>
    Math.min((this.nutrition.waterMl() / this.nutrition.waterGoalMl) * 100, 100),
  );
  protected readonly stepsPct = computed(() =>
    Math.min((this.nutrition.steps() / this.nutrition.stepsGoal) * 100, 100),
  );

  /** Metas cumplidas: muestran la pastilla "Meta cumplida". */
  protected readonly waterDone = computed(() => this.nutrition.waterMl() >= this.nutrition.waterGoalMl);
  protected readonly stepsDone = computed(() => this.nutrition.steps() >= this.nutrition.stepsGoal);

  /** Llegó al tope: el botón + se desactiva. */
  protected readonly waterAtMax = computed(() => this.nutrition.waterMl() >= this.nutrition.maxWaterMl);
  protected readonly stepsAtMax = computed(() => this.nutrition.steps() >= this.nutrition.maxSteps);

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

  /** Botones + y − del agua (ml). Celebra si con este vaso se llega a la meta. */
  protected addWater(ml: number): void {
    const goal = this.nutrition.waterGoalMl;
    const before = this.nutrition.waterMl();
    this.nutrition.addWater(ml);
    if (this.reachedGoal(before, this.nutrition.waterMl(), goal)) {
      this.celebrate('¡Meta de agua cumplida! Bien hidratado hoy.');
    }
  }

  /** Botones + y − de los pasos. Celebra si con estos pasos se llega a la meta. */
  protected addSteps(delta: number): void {
    const goal = this.nutrition.stepsGoal;
    const before = this.nutrition.steps();
    this.nutrition.setSteps(before + delta);
    if (this.reachedGoal(before, this.nutrition.steps(), goal)) {
      this.celebrate('¡Meta de pasos cumplida! Sigue moviéndote.');
    }
  }

  /**
   * true solo en el momento de cruzar la meta (antes no llegaba, ahora sí).
   * Así no se celebra otra vez con cada + después de cumplirla.
   */
  private reachedGoal(before: number, after: number, goal: number): boolean {
    return before < goal && after >= goal;
  }

  private celebrate(message: string): void {
    this.confetti.launch();
    this.toast.success(message);
  }

  /** Texto corto con lo que se comió, o "Sin registrar". */
  protected summary(meal: MealType): string {
    const names = this.nutrition.entriesFor(meal).map((e) => e.food.name);
    return names.length ? names.join(', ') : 'Sin registrar';
  }
}
