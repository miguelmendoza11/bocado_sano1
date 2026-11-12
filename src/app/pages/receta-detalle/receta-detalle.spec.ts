import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
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
});
