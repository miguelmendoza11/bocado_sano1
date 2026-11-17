import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivityLevel, Goal, Sex } from '../../core/models/nutrition.models';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemePreference, ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly nutrition = inject(NutritionService);
  protected readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);

  /** Opciones de la tarjeta Apariencia. */
  protected readonly themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'system', label: 'Sistema' },
  ];

  /** Opciones de los select (valor que se guarda + texto que se ve). */
  protected readonly sexOptions: { value: Sex; label: string }[] = [
    { value: 'hombre', label: 'Hombre' },
    { value: 'mujer', label: 'Mujer' },
  ];
  protected readonly activityOptions: { value: ActivityLevel; label: string }[] = [
    { value: 'sedentario', label: 'Sedentario (poco o nada de ejercicio)' },
    { value: 'ligero', label: 'Ligero (1–3 días por semana)' },
    { value: 'moderado', label: 'Moderado (3–5 días por semana)' },
    { value: 'activo', label: 'Activo (6–7 días por semana)' },
  ];
  protected readonly goalOptions: { value: Goal; label: string }[] = [
    { value: 'perder', label: 'Perder peso' },
    { value: 'mantener', label: 'Mantener peso' },
    { value: 'ganar', label: 'Ganar peso' },
  ];

  /** Formulario precargado con el perfil actual y el nombre de la sesión. */
  readonly form = this.buildForm();

  /** Restablecer datos: false → botón normal, true → pide confirmación. */
  protected readonly confirmingReset = signal(false);

  /** Texto del objetivo actual para el chip de la meta. */
  protected readonly goalLabel = computed(
    () => this.goalOptions.find((o) => o.value === this.nutrition.profile().goal)?.label ?? '',
  );

  /** Iniciales para el avatar: "Juan Montezuma" → "JM", "ana" → "A". */
  protected readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, ...data } = this.form.getRawValue();
    // El perfil cambia → calorieGoal() y macroGoals() se recalculan solos (Inicio y Diario también)
    this.nutrition.updateProfile({ ...data, name: name.trim() });
    // El nombre también va a la sesión (avatar, saludo y login futuro)
    this.auth.updateName(name);
    this.form.markAsPristine();
    this.toast.success('Perfil guardado. Tu meta se actualizó.');
  }

  /** Segundo clic de "Empezar de cero": borra el registro (conserva el perfil). */
  resetData(): void {
    this.nutrition.clearData();
    this.form.reset(this.formValues());
    this.confirmingReset.set(false);
    this.toast.success('Listo, empezaste de cero.');
  }

  /** Borra la sesión y vuelve a la bienvenida. */
  logout(): void {
    this.auth.logout();
    // El aviso vive fuera del router-outlet: se sigue viendo en /bienvenida
    this.toast.info('Sesión cerrada. ¡Vuelve pronto!');
    this.router.navigate(['/bienvenida']);
  }

  /** Valores del formulario a partir del perfil actual y el nombre de la sesión. */
  private formValues() {
    const p = this.nutrition.profile();
    return {
      name: this.auth.user()?.name ?? p.name,
      sex: p.sex,
      age: p.age,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      activity: p.activity,
      goal: p.goal,
    };
  }

  private buildForm() {
    const v = this.formValues();
    return this.fb.group({
      name: [v.name, [Validators.required, Validators.minLength(2)]],
      sex: [v.sex, Validators.required],
      age: [v.age, [Validators.required, Validators.min(13), Validators.max(100)]],
      heightCm: [v.heightCm, [Validators.required, Validators.min(120), Validators.max(230)]],
      weightKg: [v.weightKg, [Validators.required, Validators.min(30), Validators.max(250)]],
      activity: [v.activity, Validators.required],
      goal: [v.goal, Validators.required],
    });
  }
}
