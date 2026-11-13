import { NgOptimizedImage, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeCategoryFilter } from '../../core/models/recipe.models';
import { RecipeService } from '../../core/services/recipe.service';

@Component({
  selector: 'app-recetas',
  imports: [RouterLink, TitleCasePipe, NgOptimizedImage],
  templateUrl: './recetas.html',
  styleUrl: './recetas.scss',
})
export class Recetas {
  private readonly recipeService = inject(RecipeService);

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
  protected readonly category = signal<RecipeCategoryFilter>('todas');

  /** Recetas visibles: se recalcula sola cuando cambia search o category. */
  protected readonly filtered = computed(() =>
    this.recipeService.filter(this.search(), this.category()),
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
