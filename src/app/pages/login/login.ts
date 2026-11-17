import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginError } from '../../core/services/auth.service';
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

  /** Por qué falló el último intento (null = sin error). */
  protected readonly error = signal<LoginError | null>(null);

  /** true mientras se revisa la contraseña: el botón se desactiva para evitar doble clic. */
  protected readonly submitting = signal(false);

  constructor() {
    // Al volver a escribir, el mensaje de error se borra
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.error.set(null));
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) return;

    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    const result = await this.auth.login(email, password);
    this.submitting.set(false);

    if (!result.ok) {
      this.error.set(result.error);
      return;
    }
    // Pone el nombre del usuario en el perfil (Inicio lo saluda)
    const { name } = this.auth.user()!;
    this.nutrition.updateProfile({ name });
    this.toast.success(`¡Hola de nuevo, ${name}!`);
    this.router.navigate(['/inicio']);
  }
}
