import { Injectable, computed, inject, linkedSignal } from '@angular/core';
import { STORAGE_PREFIX, readStorage, writeStorage } from '../utils/storage';
import { AuthService } from './auth.service';
import { RECIPES } from './recipe.service';

/** Clave de localStorage con las favoritas de un usuario. */
export const favoritesKey = (email: string) => `${STORAGE_PREFIX}favorites.${email}`;

/** Ids de recetas que existen hoy en el catálogo. */
const RECIPE_IDS = new Set(RECIPES.map((r) => r.id));

/** Limpia lo leído de localStorage: solo números de recetas que todavía existen. */
function cleanIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is number => typeof id === 'number' && RECIPE_IDS.has(id));
}

/**
 * Recetas favoritas del usuario con sesión, guardadas en localStorage (no hay backend).
 * Cada cuenta tiene las suyas: favorites.<correo>.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly auth = inject(AuthService);

  /** Clave del usuario actual (null sin sesión). */
  private readonly storageKey = computed(() => {
    const email = this.auth.user()?.email;
    return email ? favoritesKey(email) : null;
  });

  /**
   * Ids favoritos. linkedSignal: cuando cambia la clave (otro usuario) se vuelve a leer
   * de localStorage, así nunca se guardan las favoritas de uno en la cuenta de otro.
   * Una cuenta nueva no tiene nada guardado: empieza vacía.
   */
  private readonly _ids = linkedSignal<ReadonlySet<number>>(() => {
    const key = this.storageKey();
    return new Set(key ? cleanIds(readStorage<unknown>(key)) : []);
  });

  /** Ids favoritos (solo lectura). */
  readonly ids = this._ids.asReadonly();

  /** Cuántas favoritas hay. */
  readonly count = computed(() => this._ids().size);

  isFavorite(id: number): boolean {
    return this._ids().has(id);
  }

  /**
   * Marca o desmarca una receta. Devuelve true si quedó como favorita.
   * Ids que no existen en el catálogo se ignoran.
   */
  toggle(id: number): boolean {
    if (!RECIPE_IDS.has(id)) return false;
    const next = new Set(this._ids());
    const added = !next.has(id);
    if (added) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this._ids.set(next);

    const key = this.storageKey();
    if (key) writeStorage(key, [...next].sort((a, b) => a - b));
    return added;
  }
}
