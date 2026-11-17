import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NutritionService } from '../../core/services/nutrition.service';
import { Inicio } from './inicio';

registerLocaleData(localeEs);

// Archivo aparte para no tocar inicio.spec.ts (agua, pasos y confeti)
describe('Inicio · saludo y consejo', () => {
  let fixture: ComponentFixture<Inicio>;
  let el: HTMLElement;

  /** Abre Inicio a una hora fija, con el reloj y el setInterval falsos. */
  async function openAt(date: Date, name = 'Juan Montezuma') {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(date);
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Inicio],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'es' }],
    }).compileComponents();
    TestBed.inject(NutritionService).updateProfile({ name });
    fixture = TestBed.createComponent(Inicio);
    el = fixture.nativeElement;
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  const title = () => el.querySelector('h1')?.textContent?.trim();
  const icon = () => el.querySelector('h1 .saludo-icono');

  it('greets in the morning with the first name and the sun icon', async () => {
    await openAt(new Date(2026, 10, 16, 8, 0));
    expect(title()).toBe('Buenos días, Juan');
    expect(icon()?.classList).toContain('morning');
    expect(icon()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('greets at night with the moon icon', async () => {
    await openAt(new Date(2026, 10, 16, 21, 0));
    expect(title()).toBe('Buenas noches, Juan');
    expect(icon()?.classList).toContain('night');
  });

  it('only greets when there is no name', async () => {
    await openAt(new Date(2026, 10, 16, 15, 0), '');
    expect(title()).toBe('Buenas tardes');
    expect(icon()?.classList).toContain('afternoon');
  });

  it('changes the greeting by itself when the hour changes', async () => {
    await openAt(new Date(2026, 10, 16, 11, 59));
    expect(title()).toBe('Buenos días, Juan');

    vi.advanceTimersByTime(60_000); // pasa 1 minuto: 12:00
    fixture.detectChanges();
    expect(title()).toBe('Buenas tardes, Juan');
    expect(icon()?.classList).toContain('afternoon');
  });

  it('shows the daily tip card before the meals of the day', async () => {
    await openAt(new Date(2026, 10, 16, 8, 0));
    const tip = el.querySelector('app-daily-tip')!;
    expect(tip.textContent).toContain('Consejo del día');
    const meals = [...el.querySelectorAll('h2')].find((h) => h.textContent?.includes('Comidas de hoy'))!;
    expect(tip.compareDocumentPosition(meals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
