import { NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeCategoryFilter } from '../../core/models/recipe.models';
import { FavoritesService } from '../../core/services/favorites.service';
import { RecipeService } from '../../core/services/recipe.service';
import { FavoriteButton } from '../../shared/favorite-button/favorite-button';

/** Pestaña elegida: una categoría (o todas) o solo las favoritas. */
export type RecipeListFilter = RecipeCategoryFilter | 'favoritas';

@Component({
  selector: 'app-recetas',
  imports: [RouterLink, TitleCasePipe, NgOptimizedImage, FavoriteButton],
  templateUrl: './recetas.html',
  styleUrl: './recetas.scss',
})
export class Recetas {
  private readonly recipeService = inject(RecipeService);
  protected readonly favorites = inject(FavoritesService);

  /** Pestañas del filtro por categoría. */
  protected readonly categories: { value: RecipeCategoryFilter; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'desayuno', label: 'Desayuno' },
    { value: 'almuerzo', label: 'Almuerzo' },
    { value: 'cena', label: 'Cena' },
    { value: 'snacks', label: 'Snacks' },
  ];

  /** Lo que el usuario escribe en el buscador. */
  protected readonly search = signal('');

  /** Pestaña elegida. */
  protected readonly category = signal<RecipeListFilter>('todas');

  /** ¿Está elegida la pestaña "Favoritas"? */
  protected readonly showFavorites = computed(() => this.category() === 'favoritas');

  /**
   * Recetas visibles: se recalcula sola cuando cambia el texto, la pestaña
   * o las favoritas (si quitas una estando en "Favoritas", desaparece al instante).
   */
  protected readonly filtered = computed(() => {
    const category = this.category();
    if (category !== 'favoritas') {
      return this.recipeService.filter(this.search(), category);
    }
    const ids = this.favorites.ids();
    return this.recipeService.filter(this.search(), 'todas').filter((r) => ids.has(r.id));
  });

  /** Estado vacío especial: en "Favoritas" sin ninguna favorita guardada. */
  protected readonly noFavoritesYet = computed(
    () => this.showFavorites() && this.favorites.count() === 0,
  );

  /**
   * Fotos que cargan primero (las 6 primeras del catálogo, las que se ven al abrir la página).
   * Va por id y no por posición: si dependiera del filtro, `priority` cambiaría después de cargar
   * la imagen y NgOptimizedImage no lo permite.
   */
  protected readonly priorityIds = new Set(
    this.recipeService
      .recipes()
      .slice(0, 6)
      .map((r) => r.id),
  );

  /** Ids de las recetas cuya foto no cargó: en esas se muestra el emoji. */
  protected readonly failedImages = signal<ReadonlySet<number>>(new Set());

  protected onImageError(id: number): void {
    this.failedImages.update((ids) => new Set(ids).add(id));
  }

  /** Vuelve a mostrar todas las recetas. */
  protected clearFilters(): void {
    this.search.set('');
    this.category.set('todas');
  }
}
