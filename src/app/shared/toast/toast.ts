import { Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../core/services/toast.service';

/** Ícono de Bootstrap Icons según el tipo de aviso. */
const ICONS: Record<ToastType, string> = {
  success: 'bi-check-circle-fill',
  info: 'bi-info-circle-fill',
  error: 'bi-exclamation-circle-fill',
};

/**
 * Pinta los avisos de ToastService. Va una sola vez en app.html,
 * por fuera del router-outlet, para que se vea en todas las pantallas.
 */
@Component({
  selector: 'app-toasts',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toasts {
  protected readonly toastService = inject(ToastService);
  protected readonly icons = ICONS;
}
