import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';
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
    expect(el.textContent).toContain('Guardado');
    expect(el.querySelector('.avatar')?.textContent?.trim()).toBe('JC');
  });

  it('hides the saved message when editing again', () => {
    const { fixture, component, el } = setup();
    component.onSubmit();
    component.form.controls.age.setValue(30);
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Guardado');
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
});
