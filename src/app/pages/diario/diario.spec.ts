import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NutritionService } from '../../core/services/nutrition.service';
import { Diario } from './diario';

describe('Diario', () => {
  let fixture: ComponentFixture<Diario>;
  let el: HTMLElement;
  let nutrition: NutritionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Diario] }).compileComponents();
    fixture = TestBed.createComponent(Diario);
    el = fixture.nativeElement;
    nutrition = TestBed.inject(NutritionService);
    await fixture.whenStable();
  });

  /** Escribe en el buscador como lo haría el usuario. */
  async function search(text: string) {
    const input = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  const resultNames = () =>
    [...el.querySelectorAll('.resultado .fw-semibold')].map((p) => p.textContent?.trim());

  const activeTab = () => el.querySelector('.tab.active')?.textContent?.trim();

  it('shows the four meals of the day', () => {
    const titles = [...el.querySelectorAll('.comidas h2')].map((h) => h.textContent?.trim());
    expect(titles).toEqual(['Desayuno', 'Almuerzo', 'Cena', 'Snacks']);
  });

  it('shows an empty message for meals without food', () => {
    expect(el.querySelectorAll('.comidas .vacio').length).toBe(2); // cena y snacks
  });

  it('lists the whole catalog when the search is empty', () => {
    expect(resultNames().length).toBe(nutrition.foods.length);
  });

  it('filters the catalog ignoring accents and case', async () => {
    await search('SALMON');
    expect(resultNames()).toEqual(['Salmón a la plancha']);
  });

  it('shows a message when nothing matches', async () => {
    await search('pizza');
    expect(resultNames().length).toBe(0);
    expect(el.querySelector('.lateral .vacio')?.textContent).toContain('pizza');
  });

  it('adds a food to the selected meal', async () => {
    el.querySelector<HTMLButtonElement>('.tab:nth-child(3)')!.click(); // Cena
    await fixture.whenStable();
    expect(activeTab()).toBe('Cena');

    await search('manzana');
    el.querySelector<HTMLButtonElement>('[aria-label="Agregar Manzana"]')!.click();
    await fixture.whenStable();

    expect(nutrition.kcalFor('cena')).toBe(95);
    expect(el.querySelector('.feedback')?.textContent).toContain('Manzana agregado a Cena');
  });

  it('removes a food with the trash button', async () => {
    const before = nutrition.consumedKcal();
    el.querySelector<HTMLButtonElement>('[aria-label="Quitar Café con leche"]')!.click();
    await fixture.whenStable();

    expect(nutrition.consumedKcal()).toBe(before - 100);
    expect(el.querySelector('[aria-label="Quitar Café con leche"]')).toBeNull();
  });

  it('selects the meal that comes in the URL (?comida=cena)', async () => {
    fixture.componentRef.setInput('comida', 'cena');
    await fixture.whenStable();
    expect(activeTab()).toBe('Cena');
  });

  it('ignores an unknown meal in the URL', async () => {
    fixture.componentRef.setInput('comida', 'pizza');
    await fixture.whenStable();
    expect(activeTab()).toBe('Desayuno');
  });
});
