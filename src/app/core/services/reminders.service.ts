import { formatNumber } from '@angular/common';
import { DestroyRef, Injectable, LOCALE_ID, computed, inject, linkedSignal, signal } from '@angular/core';
import { MealType } from '../models/nutrition.models';
import { STORAGE_PREFIX, readStorage, writeStorage } from '../utils/storage';
import { AuthService } from './auth.service';
import { NutritionService, daysAgo } from './nutrition.service';

/** Color suave del círculo del ícono (clases globales bg-*-soft). */
export type ReminderTone = 'lime' | 'orange' | 'blue';

export interface Reminder {
  /** Id estable ('agua', 'comida-almuerzo'...): así se recuerda si ya se leyó. */
  id: string;
  icon: string;
  tone: ReminderTone;
  text: string;
  route: string;
  queryParams?: Record<string, string>;
}

/** Hora (0–23) desde la que se avisa si una comida no está registrada. */
const MEAL_DEADLINES: { meal: MealType; hour: number; label: string }[] = [
  { meal: 'desayuno', hour: 10, label: 'el desayuno' },
  { meal: 'almuerzo', hour: 14, label: 'el almuerzo' },
  { meal: 'cena', hour: 20, label: 'la cena' },
];

/** Desde esta hora se avisa si los pasos van muy por debajo de la meta. */
const STEPS_HOUR = 18;
/** "Lejos de la meta" = menos del 70 %. */
const STEPS_MIN_RATIO = 0.7;
/** Días sin registrar peso para recordarlo. */
const WEIGHT_EVERY_DAYS = 7;

/** Clave de los recordatorios leídos: por usuario y por día. */
export const readKey = (email: string, date: string) =>
  `${STORAGE_PREFIX}reminders-read.${email}.${date}`;

/**
 * Recordatorios de la campana. Todos salen de los datos reales de NutritionService
 * y de la hora actual (signal `now`, que se actualiza cada minuto).
 */
@Injectable({ providedIn: 'root' })
export class RemindersService {
  private readonly nutrition = inject(NutritionService);
  private readonly auth = inject(AuthService);
  private readonly locale = inject(LOCALE_ID);

  /** Hora actual. Se actualiza cada minuto para que los recordatorios por hora aparezcan solos. */
  readonly now = signal(new Date());

  /** Fecha de hoy ("2026-11-12") según `now`: al pasar la medianoche cambia sola. */
  private readonly today = computed(() => daysAgo(0, this.now()));

  readonly reminders = computed<Reminder[]>(() => {
    const n = this.nutrition;
    const hour = this.now().getHours();
    const list: Reminder[] = [];

    // Agua
    const missingWater = n.waterGoalMl - n.waterMl();
    if (missingWater > 0) {
      list.push({
        id: 'agua',
        icon: 'bi-droplet-fill',
        tone: 'blue',
        text: `Te faltan ${this.format(missingWater)} ml de agua`,
        route: '/inicio',
      });
    }

    // Comidas sin registrar según la hora
    for (const { meal, hour: deadline, label } of MEAL_DEADLINES) {
      if (hour >= deadline && n.entriesFor(meal).length === 0) {
        list.push({
          id: `comida-${meal}`,
          icon: 'bi-egg-fried',
          tone: 'orange',
          text: `Aún no registras ${label}`,
          route: '/diario',
          queryParams: { comida: meal },
        });
      }
    }

    // Pasos lejos de la meta al final del día
    if (hour >= STEPS_HOUR && n.steps() < n.stepsGoal * STEPS_MIN_RATIO) {
      list.push({
        id: 'pasos',
        icon: 'bi-person-walking',
        tone: 'lime',
        text: `Llevas ${this.format(n.steps())} de ${this.format(n.stepsGoal)} pasos`,
        route: '/inicio',
      });
    }

    // Peso sin registrar hace una semana o más
    const lastWeight = n.weightHistory().at(-1)?.date;
    if (!lastWeight || lastWeight <= daysAgo(WEIGHT_EVERY_DAYS, this.now())) {
      list.push({
        id: 'peso',
        icon: 'bi-speedometer2',
        tone: 'blue',
        text: 'Registra tu peso de esta semana',
        route: '/progreso',
      });
    }

    // Recordatorio positivo: calorías y agua cumplidas
    if (n.consumedKcal() >= n.calorieGoal() && missingWater <= 0) {
      list.push({
        id: 'bien',
        icon: 'bi-trophy-fill',
        tone: 'lime',
        text: '¡Vas muy bien hoy! Cumpliste tus calorías y tu agua.',
        route: '/progreso',
      });
    }

    return list;
  });

  /** Clave de localStorage del usuario de hoy (null sin sesión). */
  private readonly storageKey = computed(() => {
    const email = this.auth.user()?.email;
    return email ? readKey(email, this.today()) : null;
  });

  /**
   * Ids leídos HOY por ESTE usuario. linkedSignal: se vuelve a leer de localStorage
   * cuando cambia la clave (otro usuario u otro día), así que al día siguiente vuelven a salir.
   */
  private readonly readIds = linkedSignal<string[]>(() => {
    const key = this.storageKey();
    return key ? (readStorage<string[]>(key) ?? []) : [];
  });

  readonly unread = computed(() => this.reminders().filter((r) => !this.readIds().includes(r.id)));
  readonly unreadCount = computed(() => this.unread().length);

  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  isRead(id: string): boolean {
    return this.readIds().includes(id);
  }

  markAsRead(id: string): void {
    if (this.isRead(id)) return;
    this.saveRead([...this.readIds(), id]);
  }

  markAllAsRead(): void {
    const ids = new Set([...this.readIds(), ...this.reminders().map((r) => r.id)]);
    this.saveRead([...ids]);
  }

  private saveRead(ids: string[]): void {
    this.readIds.set(ids);
    const key = this.storageKey();
    if (key) writeStorage(key, ids);
  }

  /** Números como en el resto de la app: 4.200 · 750. */
  private format(value: number): string {
    return formatNumber(value, this.locale, '1.0-0');
  }
}
