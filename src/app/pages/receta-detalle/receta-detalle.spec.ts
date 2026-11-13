import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NutritionService } from '../../core/services/nutrition.service';
import { RecetaDetalle } from './receta-detalle';

describe('RecetaDetalle', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecetaDetalle],
      providers: [
        provideRouter(
          [{ path: 'recetas/:id', component: RecetaDetalle }],
          withComponentInputBinding(),
        ),
      ],
    }).compileComponents();
  });

  /** Crea el componente pasándole el id como lo haría la URL (texto). */
  function create(id: string) {
    const fixture = TestBed.createComponent(RecetaDetalle);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('should show the recipe name and category', () => {
    const el = create('5');
    expect(el.querySelector('h1')?.textContent).toContain('Salmón al horno con verduras');
    expect(el.textContent).toContain('Recetas · Cena');
  });

  it('should list every ingredient and numbered step', () => {
    const el = create('5');
    expect(el.querySelectorAll('.ingredientes li').length).toBe(5);
    const nums = [...el.querySelectorAll('.paso-num')].map((n) => n.textContent?.trim());
    expect(nums).toEqual(['1', '2', '3', '4']);
  });

  it('should show the kcal and the three macros', () => {
    const el = create('5');
    expect(el.querySelector('app-calorie-ring')?.textContent).toContain('510');
    expect(el.querySelectorAll('.macros-lista .sano-progress').length).toBe(3);
  });

  it('should use singular "porción" when the recipe serves one', () => {
    expect(create('2').textContent).toContain('1 porción');
    expect(create('5').textContent).toContain('2 porciones');
  });

  it('should have a back button to /recetas', () => {
    const back = create('5').querySelector('a[aria-label="Volver a recetas"]');
    expect(back?.getAttribute('href')).toBe('/recetas');
  });

  it('should show "Receta no encontrada" for an unknown id', () => {
    const el = create('999');
    expect(el.textContent).toContain('Receta no encontrada');
    expect(el.querySelector('.ingredientes')).toBeNull();
  });

  it('should show "Receta no encontrada" when the id is not a number', () => {
    expect(create('abc').textContent).toContain('Receta no encontrada');
  });

  it('should read the id from the URL', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/recetas/3', RecetaDetalle);
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'Ensalada de quinoa y aguacate',
    );
  });

  describe('add to diary', () => {
    /** Crea el detalle y devuelve el HTML, el fixture y algunos atajos para el panel. */
    function setup(id: string) {
      const fixture = TestBed.createComponent(RecetaDetalle);
      fixture.componentRef.setInput('id', id);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const click = (selector: string) => {
        el.querySelector<HTMLButtonElement>(selector)!.click();
        fixture.detectChanges();
      };
      return {
        el,
        fixture,
        nutrition: TestBed.inject(NutritionService),
        activeMeal: () => el.querySelector('.comidas-tabs .tab.active')?.textContent?.trim(),
        servings: () => el.querySelector('.porciones-num')?.textContent?.trim(),
        minus: () => el.querySelector<HTMLButtonElement>('[aria-label="Quitar una porción"]')!,
        plus: () => el.querySelector<HTMLButtonElement>('[aria-label="Agregar una porción"]')!,
        clickMeal: (label: string) => {
          [...el.querySelectorAll<HTMLButtonElement>('.comidas-tabs .tab')]
            .find((b) => b.textContent?.trim() === label)!
            .click();
          fixture.detectChanges();
        },
        click,
      };
    }

    it('should start with the meal of the recipe and 1 serving', () => {
      const ui = setup('5'); // salmón: cena
      expect(ui.activeMeal()).toBe('Cena');
      expect(ui.servings()).toBe('1');
      expect(ui.el.querySelector('.agregar-accion .kcal-pill')?.textContent).toContain('510 kcal');
    });

    it('should mark only the selected meal as pressed', () => {
      const ui = setup('5');
      ui.clickMeal('Almuerzo');
      const pressed = [...ui.el.querySelectorAll('.comidas-tabs .tab[aria-pressed="true"]')];
      expect(pressed.map((b) => b.textContent?.trim())).toEqual(['Almuerzo']);
    });

    it('should keep the servings between 1 and 12 and update the kcal', () => {
      const ui = setup('5');
      expect(ui.minus().disabled).toBe(true);

      ui.click('[aria-label="Agregar una porción"]');
      expect(ui.servings()).toBe('2');
      expect(ui.el.querySelector('.agregar-accion .kcal-pill')?.textContent).toContain('1020 kcal');

      for (let i = 0; i < 20; i++) ui.click('[aria-label="Agregar una porción"]');
      expect(ui.servings()).toBe('12');
      expect(ui.plus().disabled).toBe(true);
    });

    it('should add the recipe to the chosen meal with its servings', () => {
      const ui = setup('5');
      ui.clickMeal('Almuerzo');
      ui.click('[aria-label="Agregar una porción"]');
      const before = ui.nutrition.kcalFor('almuerzo');

      ui.click('.agregar-accion .btn');

      const entry = ui.nutrition.entries().at(-1)!;
      expect(entry).toEqual(expect.objectContaining({ recipeId: 5, meal: 'almuerzo', servings: 2 }));
      expect(ui.nutrition.kcalFor('almuerzo')).toBe(before + 1020);
    });

    it('should confirm and link to the diary on the chosen meal', () => {
      const ui = setup('2'); // yogur: desayuno
      expect(ui.el.querySelector('.feedback')).toBeNull();

      ui.click('.agregar-accion .btn');

      const feedback = ui.el.querySelector('.feedback');
      expect(feedback?.textContent).toContain(
        'Bowl de yogur griego y frutos rojos (1 porción) agregado a Desayuno.',
      );
      expect(feedback?.querySelector('a')?.getAttribute('href')).toBe('/diario?comida=desayuno');
    });

    it('should reset the panel when another recipe is opened', () => {
      const ui = setup('5');
      ui.clickMeal('Snacks');
      ui.click('[aria-label="Agregar una porción"]');
      ui.click('.agregar-accion .btn');

      ui.fixture.componentRef.setInput('id', '1'); // pancakes: desayuno
      ui.fixture.detectChanges();

      expect(ui.activeMeal()).toBe('Desayuno');
      expect(ui.servings()).toBe('1');
      expect(ui.el.querySelector('.feedback')).toBeNull();
    });
  });
});
