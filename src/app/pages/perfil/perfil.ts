import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivityLevel, Goal, Sex } from '../../core/models/nutrition.models';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';

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

  /** true justo después de guardar; se apaga al volver a editar. */
  protected readonly saved = signal(false);

  /** Texto del objetivo actual para el chip de la meta. */
  protected readonly goalLabel = computed(
    () => this.goalOptions.find((o) => o.value === this.nutrition.profile().goal)?.label ?? '',
  );

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.saved.set(false));
  }

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
    this.saved.set(true);
  }

  /** Borra la sesión y vuelve a la bienvenida. */
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/bienvenida']);
  }

  private buildForm() {
    const p = this.nutrition.profile();
    return this.fb.group({
      name: [this.auth.user()?.name ?? p.name, [Validators.required, Validators.minLength(2)]],
      sex: [p.sex, Validators.required],
      age: [p.age, [Validators.required, Validators.min(13), Validators.max(100)]],
      heightCm: [p.heightCm, [Validators.required, Validators.min(120), Validators.max(230)]],
      weightKg: [p.weightKg, [Validators.required, Validators.min(30), Validators.max(250)]],
      activity: [p.activity, Validators.required],
      goal: [p.goal, Validators.required],
    });
  }
}
