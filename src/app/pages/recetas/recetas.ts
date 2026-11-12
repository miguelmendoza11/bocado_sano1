import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeCategoryFilter } from '../../core/models/recipe.models';
import { RecipeService } from '../../core/services/recipe.service';

@Component({
  selector: 'app-recetas',
  imports: [RouterLink, TitleCasePipe],
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

  /** Vuelve a mostrar todas las recetas. */
  protected clearFilters(): void {
    this.search.set('');
    this.category.set('todas');
  }
}
