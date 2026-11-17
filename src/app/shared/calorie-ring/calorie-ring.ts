import { Component, computed, input } from '@angular/core';

/**
 * Anillo de progreso en SVG.
 * Uso: <app-calorie-ring [value]="950" [max]="2200"> contenido del centro </app-calorie-ring>
 */
@Component({
  selector: 'app-calorie-ring',
  templateUrl: './calorie-ring.html',
  styleUrl: './calorie-ring.scss',
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
})
export class CalorieRing {
  /** Valor actual (por ejemplo, kcal consumidas). */
  readonly value = input.required<number>();
  /** Valor máximo (por ejemplo, meta de kcal). */
  readonly max = input.required<number>();
  /** Tamaño del anillo en píxeles. */
  readonly size = input(180);
  /** Grosor de la línea. */
  readonly stroke = input(14);

  protected readonly radius = computed(() => (this.size() - this.stroke()) / 2);
  protected readonly circumference = computed(() => 2 * Math.PI * this.radius());

  /** Porcentaje entre 0 y 1 (nunca pasa de 1 aunque te pases de la meta). */
  readonly progress = computed(() => {
    const max = this.max();
    if (max <= 0) return 0;
    return Math.min(Math.max(this.value() / max, 0), 1);
  });

  protected readonly dashOffset = computed(() => this.circumference() * (1 - this.progress()));
}
