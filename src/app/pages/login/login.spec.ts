import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';
import { ToastService } from '../../core/services/toast.service';
import { Login } from './login';

describe('Login', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('should start with an invalid form and a disabled button', () => {
    const { fixture, component } = setup();
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(component.form.invalid).toBe(true);
    expect(button.disabled).toBe(true);
  });

  it('should reject an invalid email and a short password', () => {
    const { component } = setup();
    component.form.setValue({ email: 'hola', password: '123' });
    expect(component.form.controls.email.hasError('email')).toBe(true);
    expect(component.form.controls.password.hasError('minlength')).toBe(true);
  });

  it('should show an error message when the email is touched and empty', () => {
    const { fixture, component } = setup();
    component.form.controls.email.markAsTouched();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Escribe tu correo.');
  });

  /** Crea la cuenta de Ana y cierra la sesión, como si ya se hubiera registrado antes. */
  async function registerAna() {
    const auth = TestBed.inject(AuthService);
    await auth.register('Ana Gómez', 'ana@correo.com', '123456');
    auth.logout();
  }

  it('should navigate to /inicio with the right email and password', async () => {
    await registerAna();
    const { component } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.form.setValue({ email: 'ana@correo.com', password: '123456' });
    await component.onSubmit();
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it('should save the session and greet with the registered name', async () => {
    await registerAna();
    const { component } = setup();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.form.setValue({ email: 'ana@correo.com', password: '123456' });
    await component.onSubmit();
    expect(TestBed.inject(AuthService).user()).toEqual({ name: 'Ana Gómez', email: 'ana@correo.com' });
    expect(TestBed.inject(NutritionService).profile().name).toBe('Ana Gómez');
  });

  it('should not navigate when the form is invalid', async () => {
    const { component } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    await component.onSubmit();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBe(true);
  });

  // ---------- Errores al iniciar sesión ----------

  describe('errors', () => {
    /** Envía el formulario y redibuja la página. */
    async function submit(email: string, password: string) {
      const ui = setup();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      ui.component.form.setValue({ email, password });
      await ui.component.onSubmit();
      ui.fixture.detectChanges();
      const el = ui.fixture.nativeElement as HTMLElement;
      return { ...ui, el, navigate, alert: () => el.querySelector('[role="alert"]') };
    }

    it('says that the account does not exist and links to the signup', async () => {
      const { alert, navigate } = await submit('nadie@noexiste.test', '123456');
      expect(alert()?.textContent).toContain('No encontramos una cuenta con ese correo.');
      expect(alert()?.querySelector('a')?.textContent?.trim()).toBe('Crear cuenta');
      expect(alert()?.querySelector('a')?.getAttribute('href')).toBe('/registro');
      expect(alert()?.querySelector('.bi-exclamation-circle')).not.toBeNull();
      expect(navigate).not.toHaveBeenCalled();
      expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
    });

    it('says that the password is wrong, without a link', async () => {
      await registerAna();
      const { alert, navigate } = await submit('ana@correo.com', 'otra-clave');
      expect(alert()?.textContent?.trim()).toBe('La contraseña no es correcta.');
      expect(alert()?.querySelector('a')).toBeNull();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('does not greet when the login fails', async () => {
      await submit('nadie@noexiste.test', '123456');
      expect(TestBed.inject(ToastService).toasts()).toHaveLength(0);
    });

    it('greets with a toast when the login works', async () => {
      await registerAna();
      await submit('ana@correo.com', '123456');
      expect(TestBed.inject(ToastService).toasts().at(-1)?.message).toBe('¡Hola de nuevo, Ana Gómez!');
    });

    it('clears the message when the user types again', async () => {
      const { component, fixture, alert } = await submit('nadie@noexiste.test', '123456');
      expect(alert()).not.toBeNull();
      component.form.controls.email.setValue('ana@correo.com');
      fixture.detectChanges();
      expect(alert()).toBeNull();
    });

    it('disables the button and says "Entrando..." while checking', async () => {
      await registerAna();
      const { fixture, component } = setup();
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      component.form.setValue({ email: 'ana@correo.com', password: '123456' });
      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

      const pending = component.onSubmit();
      fixture.detectChanges();
      expect(button.textContent?.trim()).toBe('Entrando...');
      expect(button.disabled).toBe(true);

      await pending;
      fixture.detectChanges();
      expect(button.textContent?.trim()).toBe('Iniciar sesión');
    });
  });
});
