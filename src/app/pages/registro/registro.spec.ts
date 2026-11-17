import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';
import { Registro } from './registro';

describe('Registro', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(Registro);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  const valid = {
    name: 'Ana',
    email: 'ana@correo.com',
    password: '123456',
    confirmPassword: '123456',
  };

  it('should start with an invalid form', () => {
    const { component } = setup();
    expect(component.form.invalid).toBe(true);
  });

  it('should be valid when all fields are correct', () => {
    const { component } = setup();
    component.form.setValue(valid);
    expect(component.form.valid).toBe(true);
  });

  it('should mark the form invalid when passwords do not match', () => {
    const { fixture, component } = setup();
    component.form.setValue({ ...valid, confirmPassword: '654321' });
    component.form.controls.confirmPassword.markAsTouched();
    fixture.detectChanges();
    expect(component.form.hasError('passwordsMismatch')).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Las contraseñas no coinciden.');
  });

  it('should save the name and navigate to /inicio on submit', async () => {
    const { component } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const nutrition = TestBed.inject(NutritionService);
    component.form.setValue({ ...valid, name: '  Ana  ' });
    await component.onSubmit();
    expect(nutrition.profile().name).toBe('Ana');
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it('should save the session with name and email', async () => {
    const { component } = setup();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.form.setValue(valid);
    await component.onSubmit();
    expect(TestBed.inject(AuthService).user()).toEqual({ name: 'Ana', email: 'ana@correo.com' });
  });

  it('should not navigate when the form is invalid', async () => {
    const { component } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    await component.onSubmit();
    expect(navigate).not.toHaveBeenCalled();
  });

  // ---------- Correo ya registrado ----------

  describe('email already registered', () => {
    async function submitTwice() {
      // Primera vez: Ana crea su cuenta y luego cierra sesión
      const auth = TestBed.inject(AuthService);
      await auth.register('Ana', 'ana@correo.com', '123456');
      auth.logout();

      const { fixture, component } = setup();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      component.form.setValue({ ...valid, name: 'Otra persona', password: 'abcdef', confirmPassword: 'abcdef' });
      await component.onSubmit();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      return { fixture, component, navigate, alert: () => el.querySelector('[role="alert"]') };
    }

    it('shows the message with a link to the login and does not enter', async () => {
      const { alert, navigate } = await submitTwice();
      expect(alert()?.textContent).toContain('Ya existe una cuenta con ese correo.');
      expect(alert()?.querySelector('a')?.textContent?.trim()).toBe('Iniciar sesión');
      expect(alert()?.querySelector('a')?.getAttribute('href')).toBe('/login');
      expect(navigate).not.toHaveBeenCalled();
      expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
    });

    it('does not change the name of the existing account', async () => {
      await submitTwice();
      const users = JSON.parse(localStorage.getItem('bocado-sano.users')!);
      expect(users['ana@correo.com'].name).toBe('Ana');
      expect(TestBed.inject(NutritionService).profile().name).not.toBe('Otra persona');
    });

    it('clears the message when the user types again', async () => {
      const { fixture, component, alert } = await submitTwice();
      component.form.controls.email.setValue('otra@correo.com');
      fixture.detectChanges();
      expect(alert()).toBeNull();
    });
  });
});
