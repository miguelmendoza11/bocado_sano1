import { Component, computed, input } from '@angular/core';

/** Contador para que cada vaso tenga su propio id de recorte (puede haber varios en pantalla). */
let nextId = 0;

/**
 * Vaso de agua en SVG que se llena según el porcentaje.
 * Uso: <app-water-glass [percent]="40" />
 */
@Component({
  selector: 'app-water-glass',
  templateUrl: './water-glass.html',
  styleUrl: './water-glass.scss',
})
export class WaterGlass {
  /** Qué tan lleno está el vaso (0–100). Fuera de ese rango se ajusta. */
  readonly percent = input.required<number>();

  /** Id único del clipPath: dos vasos con el mismo id se recortarían mal. */
  protected readonly clipId = `vaso-recorte-${nextId++}`;

  /**
   * Forma del vaso (más ancho arriba que abajo) en un lienzo de 48 × 64.
   * Se usa para el contorno y para recortar el agua: el agua nunca se sale del vaso.
   */
  protected readonly glassPath = 'M6 5 H42 L37.5 57 Q37 60 34 60 H14 Q11 60 10.5 57 Z';

  /**
   * Agua con la superficie ondulada: 4 ondas de 24 de ancho (de x=0 a x=96, el doble del vaso).
   * Al moverla 24 hacia la izquierda queda igual que al principio, así el bucle no se nota.
   */
  protected readonly wavePath = 'M0 5 Q6 2 12 5 T24 5 T36 5 T48 5 T60 5 T72 5 T84 5 T96 5 V64 H0 Z';

  /** Borde de arriba y fondo del vaso (en unidades del lienzo). */
  private readonly top = 5;
  private readonly bottom = 60;

  /** Porcentaje entre 0 y 100. */
  protected readonly level = computed(() => Math.min(Math.max(this.percent(), 0), 100));

  /**
   * El agua tiene el alto del vaso y se baja con translateY:
   * lleno = 0; vacío = baja todo y un poco más, para que ni la cresta de la ola se vea.
   * Se anima con CSS (transition), así el agua "sube" al tocar +.
   */
  protected readonly waterOffset = computed(() => {
    const level = this.level();
    const offset = ((100 - level) / 100) * (this.bottom - this.top);
    return level === 0 ? offset + 4 : offset;
  });
}
