import { Component, computed, input, linkedSignal } from '@angular/core';
import { TIPS, tipIndexFor } from '../../core/data/tips';

/**
 * Tarjeta "Consejo del día". Muestra el consejo que toca hoy y deja pasar al siguiente.
 * Uso: <app-daily-tip [date]="now()" />
 */
@Component({
  selector: 'app-daily-tip',
  templateUrl: './daily-tip.html',
  styleUrl: './daily-tip.scss',
})
export class DailyTip {
  /** Fecha y hora actual (la da Inicio, que la actualiza cada minuto). */
  readonly date = input<Date>(new Date());

  /**
   * Índice del consejo de HOY. Es un computed aparte a propósito: `date` cambia cada
   * minuto, pero este número solo cambia al cambiar el día (computed no avisa si el
   * valor es el mismo). Así "Otro consejo" no se reinicia cada minuto.
   */
  private readonly todayIndex = computed(() => tipIndexFor(this.date(), TIPS.length));

  /**
   * Consejo que se muestra. linkedSignal: empieza en el consejo del día, "Otro consejo"
   * lo cambia, y cuando cambia el día vuelve solo al consejo del nuevo día.
   */
  protected readonly index = linkedSignal(() => this.todayIndex());
  protected readonly tip = computed(() => TIPS[this.index()]);

  /** Pasa al siguiente consejo; después del último vuelve al primero. */
  nextTip(): void {
    this.index.update((i) => (i + 1) % TIPS.length);
  }
}
