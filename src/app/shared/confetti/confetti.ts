import { Component, inject } from '@angular/core';
import { ConfettiService } from '../../core/services/confetti.service';

/**
 * Capa de confeti encima de toda la app (se pone una sola vez en app.html).
 * No bloquea los clics: es solo decoración.
 */
@Component({
  selector: 'app-confetti',
  templateUrl: './confetti.html',
  styleUrl: './confetti.scss',
  host: { 'aria-hidden': 'true' },
})
export class Confetti {
  protected readonly confetti = inject(ConfettiService);
}
