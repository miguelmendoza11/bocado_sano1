import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NutritionService } from '../../core/services/nutrition.service';
import { Registro } from './registro';

describe('Registro', () => {
  beforeEach(async () => {
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

  it('should save the name and navigate to /inicio on submit', () => {
    const { component } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const nutrition = TestBed.inject(NutritionService);
    component.form.setValue({ ...valid, name: '  Ana  ' });
    component.onSubmit();
    expect(nutrition.profile().name).toBe('Ana');
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it('should not navigate when the form is invalid', () => {
    const { component } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    component.onSubmit();
    expect(navigate).not.toHaveBeenCalled();
  });
});
