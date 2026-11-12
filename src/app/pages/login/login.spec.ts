import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';
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

  it('should navigate to /inicio when the form is valid', () => {
    const { component } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.form.setValue({ email: 'ana@correo.com', password: '123456' });
    component.onSubmit();
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it('should save the session and greet with the name before @', () => {
    const { component } = setup();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.form.setValue({ email: 'ana@correo.com', password: '123456' });
    component.onSubmit();
    expect(TestBed.inject(AuthService).user()).toEqual({ name: 'ana', email: 'ana@correo.com' });
    expect(TestBed.inject(NutritionService).profile().name).toBe('ana');
  });

  it('should not navigate when the form is invalid', () => {
    const { component } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    component.onSubmit();
    expect(navigate).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBe(true);
  });
});
