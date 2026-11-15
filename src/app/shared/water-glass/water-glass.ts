import { Component } from '@angular/core';

/**
 * Vaso de agua en SVG.
 * Uso: <app-water-glass />
 * (Paso 1: por ahora solo el vaso vacío; después se llena según el agua tomada.)
 */
@Component({
  selector: 'app-water-glass',
  templateUrl: './water-glass.html',
  styleUrl: './water-glass.scss',
})
export class WaterGlass {
  /**
   * Forma del vaso (más ancho arriba que abajo) en un lienzo de 48 × 64.
   * Se usa para el contorno y, más adelante, para recortar el agua.
   */
  protected readonly glassPath = 'M6 5 H42 L37.5 57 Q37 60 34 60 H14 Q11 60 10.5 57 Z';
}
