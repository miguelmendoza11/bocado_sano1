import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Colores de la marca: cada uno es una clase del componente que usa un token. */
export type ConfettiColor = 'lime' | 'orange' | 'blue' | 'lime-strong';

/** Un papelito: todo lo que lo hace distinto de los demás. */
export interface ConfettiPiece {
  /** Posición horizontal de salida (0–100 % del ancho de la pantalla). */
  left: number;
  /** Segundos de espera antes de caer (para que no salgan todos a la vez). */
  delay: number;
  /** Segundos que tarda en cruzar la pantalla. */
  duration: number;
  /** Cuánto se corre de lado mientras cae (px, negativo = a la izquierda). */
  drift: number;
  /** Vueltas que da (grados). */
  spin: number;
  color: ConfettiColor;
  shape: 'rect' | 'circle';
}

/** Una lluvia de confeti (puede haber dos si se cumplen dos metas seguidas). */
export interface ConfettiBurst {
  id: number;
  pieces: ConfettiPiece[];
}

const COLORS: ConfettiColor[] = ['lime', 'orange', 'blue', 'lime-strong'];
const PIECES = 60;
/** Tiempo máximo de una lluvia (espera + caída más larga): después se borra. */
const BURST_MS = 3200;
/** Máximo de lluvias a la vez, para no llenar la pantalla. */
const MAX_BURSTS = 2;

/**
 * Confeti para celebrar (por ejemplo, al cumplir la meta de agua o de pasos).
 * Las páginas llaman a launch() y el componente <app-confetti /> lo dibuja.
 * Es solo CSS: no usa librerías.
 */
@Injectable({ providedIn: 'root' })
export class ConfettiService {
  private readonly document = inject(DOCUMENT);
  private readonly _bursts = signal<ConfettiBurst[]>([]);
  readonly bursts = this._bursts.asReadonly();

  private nextId = 1;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  /** Lanza una lluvia de confeti. No hace nada si el usuario pidió reducir el movimiento. */
  launch(): void {
    if (this.prefersReducedMotion()) return;

    const burst: ConfettiBurst = { id: this.nextId++, pieces: this.createPieces() };
    this._bursts.update((list) => [...list, burst].slice(-MAX_BURSTS));

    const timer = setTimeout(() => {
      this._bursts.update((list) => list.filter((b) => b.id !== burst.id));
      this.timers.delete(timer);
    }, BURST_MS);
    this.timers.add(timer);
  }

  private createPieces(): ConfettiPiece[] {
    const random = (min: number, max: number) => min + Math.random() * (max - min);
    return Array.from({ length: PIECES }, () => ({
      left: random(0, 100),
      delay: random(0, 0.6),
      duration: random(1.8, 2.6),
      drift: random(-80, 80),
      spin: random(360, 1080) * (Math.random() < 0.5 ? -1 : 1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() < 0.7 ? 'rect' : 'circle',
    }));
  }

  private prefersReducedMotion(): boolean {
    return this.document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }
}
