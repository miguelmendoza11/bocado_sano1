import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggle],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly nutrition = inject(NutritionService);

  constructor() {
    // Al recargar (F5) el perfil vuelve a los datos de prueba: le ponemos el nombre de la sesión
    effect(() => {
      const user = this.auth.user();
      if (user) this.nutrition.updateProfile({ name: user.name });
    });
  }

  /** Enlaces del menú. Para agregar una página nueva, súmala aquí. */
  protected readonly nav: NavItem[] = [
    { path: '/inicio', label: 'Inicio', icon: 'bi-house-door' },
    { path: '/diario', label: 'Diario', icon: 'bi-journal-text' },
    { path: '/recetas', label: 'Recetas', icon: 'bi-book' },
    { path: '/progreso', label: 'Progreso', icon: 'bi-graph-up' },
    { path: '/perfil', label: 'Perfil', icon: 'bi-person' },
  ];
}
