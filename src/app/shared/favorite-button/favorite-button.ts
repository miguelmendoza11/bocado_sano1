import { Component, booleanAttribute, computed, inject, input, output, signal } from '@angular/core';
import { FavoritesService } from '../../core/services/favorites.service';

/** Lo que el botón le avisa al padre cada vez que cambia. */
export interface FavoriteChange {
  recipeId: number;
  /** true = se agregó a favoritas, false = se quitó. */
  favorite: boolean;
}

/** Texto del aviso que muestran las páginas al recibir el evento (mismo texto en todas). */
export function favoriteMessage(recipeName: string, favorite: boolean): string {
  return favorite ? `${recipeName} agregada a favoritas` : `${recipeName} quitada de favoritas`;
}

/**
 * Corazón para marcar una receta como favorita.
 * Uso: <app-favorite-button [recipeId]="receta.id" />
 *      <app-favorite-button [recipeId]="receta.id" overlay describedBy="id-del-titulo" />
 *      <app-favorite-button [recipeId]="receta.id" (favoriteChange)="onFavorite($event)" />
 * OJO: es un <button>, así que NO debe ir dentro de un <a>.
 */
@Component({
  selector: 'app-favorite-button',
  templateUrl: './favorite-button.html',
  styleUrl: './favorite-button.scss',
})
export class FavoriteButton {
  private readonly favorites = inject(FavoritesService);

  /** Receta que marca o desmarca este botón. */
  readonly recipeId = input.required<number>();

  /** Estilo para ir sobre una foto: círculo semitransparente con desenfoque. */
  readonly overlay = input(false, { transform: booleanAttribute });

  /**
   * Id del elemento con el nombre de la receta (aria-describedby).
   * Así el lector de pantalla dice "Agregar a favoritas, Ensalada de quinoa…"
   * y se distinguen los corazones de una grilla.
   */
  readonly describedBy = input<string | null>(null);

  /**
   * Comunicación hijo → padre: avisa qué receta cambió y si quedó como favorita.
   * El botón no sabe el nombre de la receta ni qué aviso mostrar: eso lo decide el padre
   * (Recetas y el detalle muestran un aviso con el nombre).
   */
  readonly favoriteChange = output<FavoriteChange>();

  /** ¿La receta está en favoritas? Cambia sola si se marca desde otro lugar. */
  protected readonly isFavorite = computed(() => this.favorites.ids().has(this.recipeId()));

  /** true mientras dura la animación "pop" al marcar. */
  protected readonly popping = signal(false);

  protected toggle(): void {
    const added = this.favorites.toggle(this.recipeId());
    this.popping.set(added);
    this.favoriteChange.emit({ recipeId: this.recipeId(), favorite: added });
  }
}
