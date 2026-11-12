import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';

/** Lo que elige el usuario. "system" sigue el modo del celular o del computador. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** El tema que realmente se ve. */
export type Theme = 'light' | 'dark';

/** Misma clave que lee el script de src/index.html (evita el destello blanco al recargar). */
export const THEME_KEY = 'bocado-sano.theme';

const PREFERENCES: ThemePreference[] = ['light', 'dark', 'system'];

/**
 * Tema claro / oscuro de la app.
 * Cambia el atributo data-bs-theme de <html>, que usan tanto nuestros tokens
 * (src/styles.scss) como los componentes de Bootstrap.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');

  /** Preferencia guardada (por defecto, seguir al sistema). */
  readonly preference = signal<ThemePreference>(this.readPreference());

  /** true si el sistema operativo está en modo oscuro. */
  private readonly systemDark = signal(this.media?.matches ?? false);

  /** Tema que se aplica de verdad. */
  readonly theme = computed<Theme>(() => {
    const pref = this.preference();
    if (pref === 'system') return this.systemDark() ? 'dark' : 'light';
    return pref;
  });

  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    // Si el usuario cambia el modo del sistema con la app abierta, se actualiza solo
    const onChange = (event: MediaQueryListEvent) => this.systemDark.set(event.matches);
    this.media?.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener('change', onChange));

    // Aplica el tema en <html> y guarda la preferencia cada vez que cambian
    effect(() => {
      this.document.documentElement.setAttribute('data-bs-theme', this.theme());
      this.writePreference(this.preference());
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
  }

  /** Botón rápido: pasa al tema contrario del que se ve ahora. */
  toggle(): void {
    this.preference.set(this.isDark() ? 'light' : 'dark');
  }

  private readPreference(): ThemePreference {
    try {
      const saved = localStorage.getItem(THEME_KEY) as ThemePreference | null;
      return saved && PREFERENCES.includes(saved) ? saved : 'system';
    } catch {
      return 'system';
    }
  }

  private writePreference(preference: ThemePreference): void {
    try {
      localStorage.setItem(THEME_KEY, preference);
    } catch {
      // Sin localStorage el tema solo dura hasta recargar la página.
    }
  }
}
