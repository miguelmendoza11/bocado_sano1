import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, ThemeToggle],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly nutrition = inject(NutritionService);
  private readonly toast = inject(ToastService);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Guarda la sesión y pone el nombre del usuario en el perfil (Inicio lo saluda)
    this.auth.login(this.form.controls.email.value);
    const { name } = this.auth.user()!;
    this.nutrition.updateProfile({ name });
    this.toast.success(`¡Hola de nuevo, ${name}!`);
    this.router.navigate(['/inicio']);
  }
}
