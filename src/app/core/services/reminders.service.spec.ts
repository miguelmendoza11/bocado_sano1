import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { NutritionService, daysAgo } from './nutrition.service';
import { RemindersService, readKey } from './reminders.service';

// Números como en la app: 1.250 · 10.000
registerLocaleData(localeEs);

/** Miércoles 11 de noviembre de 2026 a la hora indicada (hora local). */
const at = (hour: number, minute = 0, day = 11) => new Date(2026, 10, day, hour, minute);

describe('RemindersService', () => {
  let service: RemindersService;
  let nutrition: NutritionService;
  let auth: AuthService;

  beforeEach(() => {
    // Solo se falsea Date: así "hoy" y la hora son siempre las mismas
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(at(9));
    localStorage.clear();

    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'es' }] });
    auth = TestBed.inject(AuthService);
    auth.register('Ana', 'ana@correo.com');
    nutrition = TestBed.inject(NutritionService);
    service = TestBed.inject(RemindersService);
    TestBed.tick(); // NutritionService carga los datos del usuario (vacíos: es nuevo)
    nutrition.resetToSample(); // estas pruebas parten de los datos de ejemplo
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  const ids = () => service.reminders().map((r) => r.id);
  /** Cambia la hora "actual" del servicio (el reloj del sistema también, por coherencia). */
  const setTime = (date: Date) => {
    vi.setSystemTime(date);
    service.now.set(date);
  };

  describe('rules', () => {
    it('reminds the missing water with the amount', () => {
      // Datos de ejemplo a las 9:00: 1.250 de 2.500 ml, desayuno y almuerzo registrados, peso de hoy
      expect(ids()).toEqual(['agua']);
      expect(service.reminders()[0]).toEqual(
        expect.objectContaining({ text: 'Te faltan 1.250 ml de agua', route: '/inicio' }),
      );
    });

    it('reminds meals that are not logged, depending on the hour', () => {
      nutrition.entries.set([]);
      expect(ids()).not.toContain('comida-desayuno'); // 9:00

      setTime(at(10));
      expect(ids()).toContain('comida-desayuno');
      expect(ids()).not.toContain('comida-almuerzo');

      setTime(at(14));
      expect(ids()).toContain('comida-almuerzo');
      expect(ids()).not.toContain('comida-cena');

      setTime(at(20));
      expect(ids()).toContain('comida-cena');
      const lunch = service.reminders().find((r) => r.id === 'comida-almuerzo')!;
      expect(lunch.text).toBe('Aún no registras el almuerzo');
      expect(lunch.queryParams).toEqual({ comida: 'almuerzo' });
    });

    it('does not remind a meal that is already logged', () => {
      setTime(at(21));
      expect(ids()).not.toContain('comida-desayuno');
      expect(ids()).not.toContain('comida-almuerzo');
      expect(ids()).toContain('comida-cena'); // los datos de ejemplo no tienen cena
    });

    it('reminds the steps after 18:00 when far from the goal', () => {
      setTime(at(17, 59));
      expect(ids()).not.toContain('pasos');

      setTime(at(18));
      const steps = service.reminders().find((r) => r.id === 'pasos');
      expect(steps?.text).toBe('Llevas 6.540 de 10.000 pasos');

      nutrition.steps.set(8000); // 80 % de la meta: ya no está "lejos"
      expect(ids()).not.toContain('pasos');
    });

    it('reminds the weight when the last one is 7 days old or more', () => {
      nutrition.weightHistory.set([{ date: daysAgo(6), kg: 72 }]);
      expect(ids()).not.toContain('peso');

      nutrition.weightHistory.set([{ date: daysAgo(7), kg: 72 }]);
      const weight = service.reminders().find((r) => r.id === 'peso');
      expect(weight).toEqual(
        expect.objectContaining({ text: 'Registra tu peso de esta semana', route: '/progreso' }),
      );
    });

    it('shows a positive reminder when calories and water are done', () => {
      expect(ids()).not.toContain('bien');
      nutrition.waterMl.set(nutrition.waterGoalMl);
      nutrition.addFood(9, 'cena', 4); // +1.240 kcal: 2.190 ≥ 2.140
      expect(ids()).toContain('bien');
      expect(ids()).not.toContain('agua');
    });
  });

  describe('read state', () => {
    it('marks one as read and saves it for this user and day', () => {
      expect(service.unreadCount()).toBe(1);
      service.markAsRead('agua');
      expect(service.isRead('agua')).toBe(true);
      expect(service.unreadCount()).toBe(0);
      expect(JSON.parse(localStorage.getItem(readKey('ana@correo.com', '2026-11-11'))!)).toEqual([
        'agua',
      ]);
    });

    it('marks all as read', () => {
      setTime(at(21));
      expect(service.unreadCount()).toBeGreaterThan(1);
      service.markAllAsRead();
      expect(service.unreadCount()).toBe(0);
    });

    it('shows them again on a new day', () => {
      service.markAsRead('agua');
      setTime(at(9, 0, 12)); // jueves
      expect(service.isRead('agua')).toBe(false);
      expect(service.unreadCount()).toBe(1);
    });

    it('keeps the read ones per user', () => {
      service.markAsRead('agua');

      auth.login('luis@correo.com');
      TestBed.tick();
      expect(service.isRead('agua')).toBe(false);

      auth.login('ana@correo.com');
      TestBed.tick();
      expect(service.isRead('agua')).toBe(true);
    });
  });
});
