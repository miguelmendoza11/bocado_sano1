import { Component, computed, inject, signal } from '@angular/core';
import { RemindersService } from '../../core/services/reminders.service';

let nextId = 0;

/**
 * Campana de recordatorios: botón con el contador de no leídos.
 * Es un componente aparte para poder ponerla en Inicio (y luego en la barra lateral).
 */
@Component({
  selector: 'app-reminders-bell',
  templateUrl: './reminders-bell.html',
  styleUrl: './reminders-bell.scss',
})
export class RemindersBell {
  protected readonly reminders = inject(RemindersService);

  /** true mientras el panel está abierto. */
  protected readonly open = signal(false);

  /** Id del panel para aria-controls (único por si hay dos campanas en la página). */
  protected readonly panelId = `recordatorios-${nextId++}`;

  /** Lo que lee el lector de pantalla: "Notificaciones, 2 sin leer". */
  protected readonly label = computed(() => {
    const count = this.reminders.unreadCount();
    return count ? `Notificaciones, ${count} sin leer` : 'Notificaciones';
  });

  /** Más de 9 se muestra como "9+" para que quepa en el círculo. */
  protected readonly badge = computed(() => {
    const count = this.reminders.unreadCount();
    return count > 9 ? '9+' : String(count);
  });

  toggle(): void {
    this.open.update((value) => !value);
  }
}
