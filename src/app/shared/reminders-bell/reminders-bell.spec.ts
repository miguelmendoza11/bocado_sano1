import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NutritionService } from '../../core/services/nutrition.service';
import { RemindersService } from '../../core/services/reminders.service';
import { RemindersBell } from './reminders-bell';

registerLocaleData(localeEs);

describe('RemindersBell', () => {
  let fixture: ComponentFixture<RemindersBell>;
  let el: HTMLElement;
  let reminders: RemindersService;
  let nutrition: NutritionService;

  beforeEach(async () => {
    // 21:00 con los datos de ejemplo (y 8.000 pasos): agua y cena pendientes (2 recordatorios)
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 21, 0));
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [RemindersBell],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'es' }],
    }).compileComponents();
    TestBed.inject(AuthService).register('Ana', 'ana@correo.com');
    nutrition = TestBed.inject(NutritionService);
    reminders = TestBed.inject(RemindersService);
    TestBed.tick(); // carga los datos de ejemplo del usuario
    nutrition.steps.set(8000); // pasos cerca de la meta: sin recordatorio de pasos

    fixture = TestBed.createComponent(RemindersBell);
    el = fixture.nativeElement;
    document.body.appendChild(el); // para probar el foco y los clics "afuera"
    await fixture.whenStable();
  });

  afterEach(() => {
    el.remove();
    vi.useRealTimers();
    localStorage.clear();
  });

  const bell = () => el.querySelector<HTMLButtonElement>('.campana')!;
  const panel = () => el.querySelector('.panel');
  const items = () => [...el.querySelectorAll<HTMLButtonElement>('.recordatorio')];

  async function openPanel() {
    bell().click();
    await fixture.whenStable();
  }

  it('shows the unread count in the badge and the label', () => {
    expect(el.querySelector('.contador')?.textContent?.trim()).toBe('2');
    expect(bell().getAttribute('aria-label')).toBe('Notificaciones, 2 sin leer');
  });

  it('opens and closes the panel with the bell', async () => {
    expect(panel()).toBeNull();
    expect(bell().getAttribute('aria-expanded')).toBe('false');

    await openPanel();
    expect(bell().getAttribute('aria-expanded')).toBe('true');
    expect(panel()?.id).toBe(bell().getAttribute('aria-controls'));
    expect(panel()?.textContent).toContain('Recordatorios');
    expect(items().map((b) => b.textContent?.trim())).toEqual([
      'Te faltan 1.250 ml de agua',
      'Aún no registras la cena',
    ]);

    await openPanel(); // segundo clic
    expect(panel()).toBeNull();
  });

  it('closes with Escape and gives the focus back to the bell', async () => {
    await openPanel();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(bell());
  });

  it('closes when clicking outside', async () => {
    await openPanel();
    panel()!.querySelector('h2')!.click(); // adentro: sigue abierto
    await fixture.whenStable();
    expect(panel()).not.toBeNull();

    document.body.click(); // afuera
    await fixture.whenStable();
    expect(panel()).toBeNull();
  });

  it('marks a reminder as read and navigates to its page', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await openPanel();

    items()[1].click(); // la cena
    await fixture.whenStable();

    expect(reminders.isRead('comida-cena')).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/diario'], { queryParams: { comida: 'cena' } });
    expect(panel()).toBeNull();
    expect(el.querySelector('.contador')?.textContent?.trim()).toBe('1');
  });

  it('marks all as read: hides the badge and disables the button', async () => {
    await openPanel();
    const markAll = el.querySelector<HTMLButtonElement>('.btn-texto')!;
    markAll.click();
    await fixture.whenStable();

    expect(el.querySelector('.contador')).toBeNull();
    expect(bell().getAttribute('aria-label')).toBe('Notificaciones');
    expect(markAll.disabled).toBe(true);
    expect(items().every((b) => b.classList.contains('leido'))).toBe(true);
  });

  it('shows an empty state when there is nothing to remind', async () => {
    nutrition.waterMl.set(nutrition.waterGoalMl);
    nutrition.addFood(1, 'cena'); // con cena registrada no queda nada pendiente
    await openPanel();
    expect(items()).toHaveLength(0);
    expect(panel()?.textContent).toContain('Todo al día');
  });
});
