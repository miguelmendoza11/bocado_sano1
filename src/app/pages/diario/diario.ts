import { DecimalPipe } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Food, MealType } from '../../core/models/nutrition.models';
import { NutritionService } from '../../core/services/nutrition.service';
import { ToastService } from '../../core/services/toast.service';

/** Quita tildes y pasa a minúsculas para comparar ("Salmón" = "salmon"). */
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-diario',
  imports: [DecimalPipe],
  templateUrl: './diario.html',
  styleUrl: './diario.scss',
})
export class Diario {
  protected readonly nutrition = inject(NutritionService);
  private readonly injector = inject(Injector);
  private readonly toast = inject(ToastService);

  /**
   * Comida que llega por la URL: /diario?comida=cena
   * (withComponentInputBinding pasa los query params como input).
   */
  readonly comida = input<string>();

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /** Comida elegida en las pestañas del buscador. */
  protected readonly selectedMeal = signal<MealType>('desayuno');

  /** Texto escrito en el buscador. */
  protected readonly query = signal('');

  /** Catálogo filtrado por el texto del buscador. */
  protected readonly results = computed(() => {
    const q = normalize(this.query());
    if (!q) return this.nutrition.foods;
    return this.nutrition.foods.filter((f) => normalize(f.name).includes(q));
  });

  /** Porcentaje de la meta ya consumido (0–100) para la barra del resumen. */
  protected readonly percent = computed(() =>
    Math.min((this.nutrition.consumedKcal() / this.nutrition.calorieGoal()) * 100, 100),
  );

  constructor() {
    // Si la URL trae una comida válida, se elige esa pestaña y se enfoca el buscador
    effect(() => {
      const meal = this.nutrition.meals.find((m) => m.type === this.comida())?.type;
      if (!meal) return;
      untracked(() => this.selectedMeal.set(meal));
      afterNextRender(() => this.focusSearch(), { injector: this.injector });
    });
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  /** El "+" de cada comida: elige esa comida y lleva al buscador. */
  protected startAdding(meal: MealType): void {
    this.selectedMeal.set(meal);
    this.focusSearch();
  }

  private focusSearch(): void {
    const field = this.searchInput()?.nativeElement;
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field?.focus({ preventScroll: true });
  }

  protected add(food: Food): void {
    const meal = this.selectedMeal();
    this.nutrition.addFood(food.id, meal);
    // addFood no devuelve el id: la entrada nueva es la última de la lista
    const entryId = this.nutrition.entries().at(-1)?.id;

    const label = this.nutrition.meals.find((m) => m.type === meal)?.label ?? meal;
    this.toast.success(`${food.name} agregado a ${label}`, {
      // "Deshacer" quita justo esa entrada (no la última que haya en ese momento)
      action: { label: 'Deshacer', run: () => entryId && this.nutrition.removeEntry(entryId) },
    });
  }
}
