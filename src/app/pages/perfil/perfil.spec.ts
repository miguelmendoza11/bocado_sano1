import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';
import { Perfil } from './perfil';

describe('Perfil', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [provideRouter([])],
    }).compileComponents();
    TestBed.inject(AuthService).register('Juan Montezuma', 'juan@correo.com');
  });

  afterEach(() => localStorage.clear());

  function setup() {
    const fixture = TestBed.createComponent(Perfil);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, component: fixture.componentInstance, el };
  }

  it('shows the logged in user with initials', () => {
    const { el } = setup();
    expect(el.querySelector('.avatar')?.textContent?.trim()).toBe('JM');
    expect(el.textContent).toContain('Juan Montezuma');
    expect(el.textContent).toContain('juan@correo.com');
  });

  it('preloads the form with the current profile', () => {
    const { component } = setup();
    expect(component.form.getRawValue()).toEqual({
      name: 'Juan Montezuma',
      sex: 'hombre',
      age: 24,
      heightCm: 175,
      weightKg: 72.4,
      activity: 'moderado',
      goal: 'perder',
    });
  });

  it('rejects values out of range', () => {
    const { component } = setup();
    const { age, heightCm, weightKg, name } = component.form.controls;
    age.setValue(5);
    heightCm.setValue(300);
    weightKg.setValue(20);
    name.setValue('J');
    expect(age.hasError('min')).toBe(true);
    expect(heightCm.hasError('max')).toBe(true);
    expect(weightKg.hasError('min')).toBe(true);
    expect(name.hasError('minlength')).toBe(true);
  });

  it('does not save when the form is invalid', () => {
    const { component } = setup();
    const nutrition = TestBed.inject(NutritionService);
    component.form.controls.age.setValue(200);
    component.onSubmit();
    expect(nutrition.profile().age).toBe(24);
    expect(component.form.controls.age.touched).toBe(true);
  });

  it('saves the profile and recalculates the calorie goal', () => {
    const { fixture, component, el } = setup();
    const nutrition = TestBed.inject(NutritionService);
    const before = nutrition.calorieGoal();

    component.form.patchValue({ goal: 'ganar', name: 'Juan Carlos' });
    component.onSubmit();
    fixture.detectChanges();

    expect(nutrition.profile().goal).toBe('ganar');
    expect(nutrition.calorieGoal()).toBe(before + 800); // −500 → +300
    expect(TestBed.inject(AuthService).user()?.name).toBe('Juan Carlos');
    expect(TestBed.inject(ToastService).toasts().at(-1)?.message).toBe('Perfil guardado. Tu meta se actualizó.');
    expect(el.querySelector('.avatar')?.textContent?.trim()).toBe('JC');
  });

  it('logs out and goes to /bienvenida', () => {
    const { el } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const button = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Cerrar sesión'),
    )!;
    button.click();
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/bienvenida']);
  });

  // ---------- Apariencia ----------

  const themeOptions = (el: HTMLElement) => [...el.querySelectorAll<HTMLButtonElement>('.opcion-tema')];

  it('shows the three theme options with the current one checked', () => {
    TestBed.inject(ThemeService).setPreference('dark');
    const { el } = setup();
    const options = themeOptions(el);
    expect(options.map((b) => b.textContent?.trim())).toEqual(['Claro', 'Oscuro', 'Sistema']);
    expect(options.map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
  });

  it('changes the theme when an option is chosen', async () => {
    const { fixture, el } = setup();
    const theme = TestBed.inject(ThemeService);

    themeOptions(el)[1].click(); // Oscuro
    await fixture.whenStable();
    expect(theme.preference()).toBe('dark');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');

    themeOptions(el)[2].click(); // Sistema
    await fixture.whenStable();
    expect(theme.preference()).toBe('system');
    expect(el.querySelector('.card-apariencia')?.textContent).toContain('Sigue el modo de tu dispositivo');
  });

  // ---------- Empezar de cero ----------

  const buttonWith = (el: HTMLElement, text: string) =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(text));

  it('asks for confirmation before starting over', async () => {
    const { fixture, el } = setup();
    const nutrition = TestBed.inject(NutritionService);
    nutrition.addFood(7, 'snacks'); // manzana 95

    buttonWith(el, 'Empezar de cero')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.aviso-reset')?.textContent).toContain('Se borrarán');
    expect(nutrition.consumedKcal()).toBe(95); // todavía no se borró nada

    buttonWith(el, 'Cancelar')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.aviso-reset')).toBeNull();
    expect(nutrition.consumedKcal()).toBe(95);
  });

  it('clears the diet data but keeps the profile after confirming', async () => {
    const { fixture, el, component } = setup();
    const nutrition = TestBed.inject(NutritionService);
    const toast = vi.spyOn(TestBed.inject(ToastService), 'success');
    nutrition.addFood(7, 'snacks');
    nutrition.addWater(500);
    nutrition.updateProfile({ age: 40 });

    buttonWith(el, 'Empezar de cero')!.click();
    await fixture.whenStable();
    buttonWith(el, 'Sí, borrar todo')!.click();
    await fixture.whenStable();

    expect(nutrition.consumedKcal()).toBe(0);
    expect(nutrition.waterMl()).toBe(0);
    expect(component.form.controls.age.value).toBe(40);
    expect(component.form.controls.name.value).toBe('Juan Montezuma');
    expect(toast).toHaveBeenCalledWith('Listo, empezaste de cero.');
  });
});
