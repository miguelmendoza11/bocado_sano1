import { Component, computed, inject, input, signal } from '@angular/core';
import { FavoritesService } from '../../core/services/favorites.service';
import { ToastService } from '../../core/services/toast.service';

/**
 * Corazón para marcar una receta como favorita.
 * Uso: <app-favorite-button [recipeId]="receta.id" />
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

  /** ¿La receta está en favoritas? Cambia sola si se marca desde otro lugar. */
  protected readonly isFavorite = computed(() => this.favorites.ids().has(this.recipeId()));

  /** true mientras dura la animación "pop" al marcar. */
  protected readonly popping = signal(false);

  protected toggle(): void {
    const added = this.favorites.toggle(this.recipeId());
    this.popping.set(added);
    if (added) {
      this.toast.success('Agregada a favoritas');
    } else {
      this.toast.info('Quitada de favoritas');
    }
  }
}
