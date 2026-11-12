import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  /** Enlaces del menú. Para agregar una página nueva, súmala aquí. */
  protected readonly nav: NavItem[] = [
    { path: '/inicio', label: 'Inicio', icon: 'bi-house-door' },
    { path: '/diario', label: 'Diario', icon: 'bi-journal-text' },
    { path: '/recetas', label: 'Recetas', icon: 'bi-book' },
    { path: '/progreso', label: 'Progreso', icon: 'bi-graph-up' },
    { path: '/perfil', label: 'Perfil', icon: 'bi-person' },
  ];
}
