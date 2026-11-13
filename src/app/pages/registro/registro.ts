import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';

/** Valida que los campos password y confirmPassword del grupo sean iguales. */
export const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordsMismatch: true } : null;
};

@Component({
  selector: 'app-registro',
  imports: [RouterLink, ReactiveFormsModule, ThemeToggle],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly nutrition = inject(NutritionService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email } = this.form.getRawValue();
    // Crea la cuenta y deja la sesión iniciada
    this.auth.register(name, email);
    this.nutrition.updateProfile({ name: name.trim() });
    this.toast.success(`Cuenta creada. ¡Bienvenido, ${name.trim()}!`);
    this.router.navigate(['/inicio']);
  }
}
