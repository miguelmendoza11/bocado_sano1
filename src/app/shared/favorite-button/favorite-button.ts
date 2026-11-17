import { Component, booleanAttribute, computed, inject, input, output, signal } from '@angular/core';
import { FavoritesService } from '../../core/services/favorites.service';
import { ToastService } from '../../core/services/toast.service';

/** Lo que el botón le avisa al padre cada vez que cambia. */
export interface FavoriteChange {
  recipeId: number;
  /** true = se agregó a favoritas, false = se quitó. */
  favorite: boolean;
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
  private readonly toast = inject(ToastService);

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
   * El padre decide qué hacer con eso (por ejemplo, mostrar un aviso con el nombre).
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
    if (added) {
      this.toast.success('Agregada a favoritas');
    } else {
      this.toast.info('Quitada de favoritas');
    }
  }
}
