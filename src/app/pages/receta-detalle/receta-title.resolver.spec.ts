import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Route, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { RecetaDetalle } from './receta-detalle';
import { recipeTitle } from './receta-title.resolver';

describe('recipeTitle', () => {
  let harness: RouterTestingHarness;
  let title: Title;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'recetas/:id', component: RecetaDetalle, title: recipeTitle }],
          withComponentInputBinding(),
        ),
      ],
    });
    harness = await RouterTestingHarness.create();
    title = TestBed.inject(Title);
  });

  afterEach(() => localStorage.clear());

  it('shows the recipe name in the browser tab', async () => {
    await harness.navigateByUrl('/recetas/3');
    expect(title.getTitle()).toBe('Ensalada de quinoa y aguacate · Bocado Sano');
  });

  it('updates the title when another recipe is opened', async () => {
    await harness.navigateByUrl('/recetas/3');
    const page = harness.routeDebugElement?.componentInstance;

    await harness.navigateByUrl('/recetas/5');
    expect(title.getTitle()).toBe('Salmón al horno con verduras · Bocado Sano');
    // Es la misma página reutilizada: el título igual se actualiza
    expect(harness.routeDebugElement?.componentInstance).toBe(page);
  });

  it('says "Receta no encontrada" for an unknown id', async () => {
    await harness.navigateByUrl('/recetas/999');
    expect(title.getTitle()).toBe('Receta no encontrada · Bocado Sano');
  });

  it('says "Receta no encontrada" when the id is not a number', async () => {
    await harness.navigateByUrl('/recetas/abc');
    expect(title.getTitle()).toBe('Receta no encontrada · Bocado Sano');
  });

  it('goes back to the recipe name after a not found page', async () => {
    await harness.navigateByUrl('/recetas/999');
    await harness.navigateByUrl('/recetas/1');
    expect(title.getTitle()).toBe('Pancakes de avena y banano · Bocado Sano');
  });

  it('is the title used by the real /recetas/:id route', () => {
    const find = (list: Route[]): Route | undefined =>
      list.reduce<Route | undefined>(
        (found, r) => found ?? (r.path === 'recetas/:id' ? r : find(r.children ?? [])),
        undefined,
      );
    expect(find(routes)?.title).toBe(recipeTitle);
  });
});
