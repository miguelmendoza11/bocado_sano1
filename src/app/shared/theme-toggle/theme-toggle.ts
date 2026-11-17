import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

/** Contador para que cada botón tenga su propio id de máscara SVG. */
let nextId = 0;

/**
 * Botón redondo para cambiar entre claro y oscuro.
 * El ícono es un SVG que se transforma: luna en modo claro, sol en modo oscuro.
 */
@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly maskId = `theme-toggle-mask-${nextId++}`;
}
