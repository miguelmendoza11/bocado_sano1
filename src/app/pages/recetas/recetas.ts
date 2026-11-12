import { Component } from '@angular/core';

@Component({
  selector: 'app-recetas',
  templateUrl: './recetas.html',
  styleUrl: './recetas.scss',
})
export class Recetas {
  /** Tarjetas de ejemplo (vacías) mientras llegan los datos reales. */
  protected readonly placeholders = [1, 2, 3, 4, 5, 6];
}
