import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NutritionService } from '../../core/services/nutrition.service';
import { ToastService } from '../../core/services/toast.service';
import { Progreso } from './progreso';

// Igual que en app.config.ts: números como 1.919 y 71,8, días como "jue"
registerLocaleData(localeEs);

describe('Progreso', () => {
  let fixture: ComponentFixture<Progreso>;
  let component: Progreso;
  let el: HTMLElement;
  let nutrition: NutritionService;

  beforeEach(async () => {
    // Reloj fijo en el miércoles 11 de noviembre de 2026, para que las fechas de prueba
    // (que se generan desde "hoy") den siempre lo mismo. Solo se falsea Date.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));

    await TestBed.configureTestingModule({
      imports: [Progreso],
      providers: [{ provide: LOCALE_ID, useValue: 'es' }],
    }).compileComponents();
    fixture = TestBed.createComponent(Progreso);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    nutrition = TestBed.inject(NutritionService);
    nutrition.resetToSample(); // estas pruebas parten de los datos de ejemplo
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const text = (selector: string) => el.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const barCols = () => [...el.querySelectorAll<HTMLElement>('.barra-col')];

  /** Escribe en el campo de peso y envía el formulario, como el usuario. */
  async function submitWeight(value: string) {
    const input = el.querySelector<HTMLInputElement>('#peso-hoy')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable(); // como en el navegador: Angular procesa lo escrito antes de enviar
    el.querySelector<HTMLFormElement>('.peso-form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  // ---------- Resumen ----------

  it('builds a 7-day week that ends today with the diary calories', () => {
    const week = component.week();
    expect(week.length).toBe(7);
    expect(week.at(-1)).toEqual({ date: '2026-11-11', kcal: 950 });
  });

  it('shows the weekly average and the days within the goal', () => {
    // (2050 + 1890 + 2240 + 1980 + 2310 + 2010 + 950) / 7 = 1918,6 → 1919
    expect(component.average()).toBe(1919);
    expect(component.daysOnGoal()).toBe(5);
    expect(el.textContent).toContain('1.919 kcal');
    expect(el.textContent).toContain('5 / 7');
  });

  it('does not count days without records in the average or the goal', async () => {
    // Martes 10 sin abrir la app (0 kcal); el resto igual
    nutrition.weekHistory.update((week) =>
      week.map((d) => (d.date === '2026-11-10' ? { ...d, kcal: 0 } : d)),
    );
    await fixture.whenStable();

    // (2050 + 1890 + 2240 + 1980 + 2310 + 950) / 6 = 1903,3 → 1903
    expect(component.loggedDays().length).toBe(6);
    expect(component.average()).toBe(1903);
    expect(component.daysOnGoal()).toBe(4);
    expect(el.textContent).toContain('4 / 6');
    expect(el.textContent).toContain('6 de 7 días con registro');
  });

  it('shows the current weight and the total change', () => {
    expect(component.totalWeightChange()).toBe(-1.7);
    expect(text('.sano-card-dark')).toContain('72,4 kg');
    expect(text('.sano-card-dark')).toContain('1,7 kg desde el 14 oct');
  });

  // ---------- Barras ----------

  it('draws one bar per day with the weekday below', () => {
    expect(barCols().length).toBe(7);
    const days = [...el.querySelectorAll('.barras-dias span')].map((s) => s.textContent?.trim());
    expect(days).toEqual(['jue', 'vie', 'sáb', 'dom', 'lun', 'mar', 'hoy']);
  });

  it('scales the bars and the goal line to the chart max', () => {
    expect(component.chartMax()).toBe(3000);
    const firstBar = el.querySelector<HTMLElement>('.barra')!;
    expect(parseFloat(firstBar.style.height)).toBeCloseTo((2050 / 3000) * 100, 1);
    const goalLine = el.querySelector<HTMLElement>('.linea-meta')!;
    expect(parseFloat(goalLine.style.bottom)).toBeCloseTo((2140 / 3000) * 100, 1);
  });

  it('marks the days over the goal and highlights today', () => {
    const over = barCols().map((c) => c.classList.contains('over'));
    expect(over).toEqual([false, false, true, false, true, false, false]);
    expect(barCols().at(-1)!.classList).toContain('hoy');
  });

  it('updates today live when food is added in the diary', async () => {
    nutrition.addFood(9, 'cena', 4); // 4 × salmón (310) → 950 + 1240 = 2190
    await fixture.whenStable();
    expect(text('.card-grafica .text-secondary-sano')).toContain('Hoy llevas 2.190 kcal');
    expect(barCols().at(-1)!.classList).toContain('over');
    expect(component.daysOnGoal()).toBe(4);
  });

  // ---------- Línea de peso ----------

  it('turns every weight entry into a point of the line', () => {
    const points = component.weightPoints();
    expect(points.length).toBe(5);
    expect(points[0].x).toBe(24);
    expect(points.at(-1)!.x).toBe(276);
    // El peso más alto queda arriba (y más pequeña)
    expect(points[0].y).toBeLessThan(points.at(-1)!.y);
    expect(el.querySelectorAll('.grafica-peso circle').length).toBe(5);
    expect(el.querySelector('polyline')!.getAttribute('points')!.split(' ').length).toBe(5);
  });

  it('shows the weight and date of each point', () => {
    const values = [...el.querySelectorAll('.grafica-peso .valor')].map((t) => t.textContent?.trim());
    const dates = [...el.querySelectorAll('.grafica-peso .fecha')].map((t) => t.textContent?.trim());
    expect(values).toEqual(['74,1', '73,6', '73,4', '73,0', '72,4']);
    expect(dates).toEqual(['14 oct', '21 oct', '28 oct', '4 nov', '11 nov']);
  });

  // ---------- Registrar peso ----------

  it('asks for a weight when the field is empty', async () => {
    await submitWeight('');
    expect(text('#peso-ayuda')).toContain('Escribe tu peso.');
    expect(nutrition.currentWeight()).toBe(72.4);
  });

  it('rejects a weight out of range', async () => {
    await submitWeight('500');
    expect(text('#peso-ayuda')).toContain('Escribe un peso entre 30 y 300 kg.');
    expect(nutrition.currentWeight()).toBe(72.4);
  });

  it('saves today’s weight and updates the chart and summary', async () => {
    await submitWeight('71.8');
    expect(TestBed.inject(ToastService).toasts().at(-1)?.message).toBe('Peso guardado: 71,8 kg');
    // Hoy (11 nov) ya tenía peso, así que se reemplaza: siguen 5 puntos
    expect(component.weightPoints().length).toBe(5);
    expect(el.querySelector('.grafica-peso .valor.ultimo')?.textContent?.trim()).toBe('71,8');
    expect(text('.sano-card-dark')).toContain('71,8 kg');
    expect(el.querySelector<HTMLInputElement>('#peso-hoy')!.value).toBe('');
  });

  it('accepts a comma as decimal separator', async () => {
    component.weightInput.set('71,5');
    component.saveWeight(new Event('submit'));
    await fixture.whenStable();
    expect(nutrition.currentWeight()).toBe(71.5);
  });

  it('shows 7 empty days and an empty weight chart for a new account', async () => {
    nutrition.clearData();
    nutrition.weightHistory.set([]);
    await fixture.whenStable();

    expect(barCols().length).toBe(7);
    expect(component.average()).toBe(0);
    expect(el.querySelector('.grafica-peso')).toBeNull();
    expect(text('.peso-vacio')).toContain('Aún no hay pesos registrados');
  });
});
