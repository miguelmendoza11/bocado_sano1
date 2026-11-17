import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Reminder, RemindersService } from '../../core/services/reminders.service';

let nextId = 0;

/**
 * Campana de recordatorios: botón con el contador de no leídos y un panel desplegable
 * hecho a mano (sin el JS de Bootstrap).
 * Es un componente aparte para poder ponerla en Inicio (y luego en la barra lateral).
 */
@Component({
  selector: 'app-reminders-bell',
  templateUrl: './reminders-bell.html',
  styleUrl: './reminders-bell.scss',
  host: {
    // Cerrar con Escape o tocando fuera de la campana y del panel
    '(document:keydown.escape)': 'closeAndFocus()',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class RemindersBell {
  protected readonly reminders = inject(RemindersService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('bellButton');

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

  constructor() {
    // Al empezar cualquier navegación (enlace, botón atrás...) se cierra el panel
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.open.set(false));
  }

  toggle(): void {
    this.open.update((value) => !value);
  }

  /** Tocar un recordatorio: se marca como leído, se cierra el panel y se va a su página. */
  protected go(reminder: Reminder): void {
    this.reminders.markAsRead(reminder.id);
    this.open.set(false);
    this.router.navigate([reminder.route], { queryParams: reminder.queryParams });
  }

  protected markAll(): void {
    this.reminders.markAllAsRead();
  }

  /** Escape: cierra y devuelve el foco a la campana (para quien usa teclado). */
  protected closeAndFocus(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.button().nativeElement.focus();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
