import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfettiService } from '../../core/services/confetti.service';
import { NutritionService } from '../../core/services/nutrition.service';
import { ToastService } from '../../core/services/toast.service';
import { Inicio } from './inicio';

// Números como en la app: 2,5 L · 10.000
registerLocaleData(localeEs);

describe('Inicio · agua, pasos y celebración', () => {
  let fixture: ComponentFixture<Inicio>;
  let el: HTMLElement;
  let nutrition: NutritionService;
  let launch: ReturnType<typeof vi.spyOn>;
  let toast: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Inicio],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'es' }],
    }).compileComponents();
    nutrition = TestBed.inject(NutritionService);
    launch = vi.spyOn(TestBed.inject(ConfettiService), 'launch').mockImplementation(() => {});
    toast = vi.spyOn(TestBed.inject(ToastService), 'success');
    fixture = TestBed.createComponent(Inicio);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  const button = (label: string) => el.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
  const waterCard = () => button('Agregar 250 ml de agua').closest('section')!;
  const stepsCard = () => button('Agregar 1.000 pasos').closest('section')!;

  async function click(label: string, times = 1) {
    for (let i = 0; i < times; i++) button(label).click();
    await fixture.whenStable();
  }

  it('fills the glass with the water of the day', async () => {
    nutrition.addWater(1250); // la mitad de 2,5 L
    await fixture.whenStable();
    const transform = el.querySelector<SVGGElement>('app-water-glass .agua')!.style.transform;
    expect(transform).toBe('translateY(27.5px)');
  });

  it('celebrates once when the water goal is reached', async () => {
    nutrition.addWater(2250);
    await click('Agregar 250 ml de agua'); // 2,5 L: cruza la meta
    expect(launch).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith('¡Meta de agua cumplida! Bien hidratado hoy.');

    await click('Agregar 250 ml de agua'); // 2,75 L: ya estaba cumplida
    expect(launch).toHaveBeenCalledTimes(1);
  });

  it('celebrates when the steps goal is reached', async () => {
    nutrition.setSteps(9000);
    await click('Agregar 1.000 pasos');
    expect(launch).toHaveBeenCalledTimes(1);
    expect(toast).toHaveBeenCalledWith('¡Meta de pasos cumplida! Sigue moviéndote.');
  });

  it('does not celebrate below the goal or when going down', async () => {
    await click('Agregar 250 ml de agua', 3); // 750 ml
    nutrition.setSteps(11000);
    await click('Quitar 1.000 pasos'); // 10.000: sigue cumplida, pero bajando
    expect(launch).not.toHaveBeenCalled();
  });

  it('shows the goal chip instead of the goal when it is reached', async () => {
    expect(waterCard().textContent).toContain('de 2,5 L');
    expect(waterCard().querySelector('.meta-ok')).toBeNull();

    nutrition.addWater(2500);
    nutrition.setSteps(10000);
    await fixture.whenStable();

    expect(waterCard().querySelector('.meta-ok')?.textContent).toContain('Cumplida');
    expect(waterCard().textContent).not.toContain('de 2,5 L');
    expect(stepsCard().querySelector('.meta-ok')?.textContent).toContain('Cumplida');
  });

  it('keeps going over the goal but disables + at the cap', async () => {
    nutrition.addWater(5750);
    await fixture.whenStable();
    expect(button('Agregar 250 ml de agua').disabled).toBe(false);

    await click('Agregar 250 ml de agua'); // 6 L: el tope
    expect(nutrition.waterMl()).toBe(6000);
    expect(button('Agregar 250 ml de agua').disabled).toBe(true);
    expect(button('Agregar 250 ml de agua').title).toBe('Llegaste al máximo de 6 L');
    expect(button('Quitar 250 ml de agua').disabled).toBe(false);

    nutrition.setSteps(60000);
    await fixture.whenStable();
    expect(button('Agregar 1.000 pasos').disabled).toBe(true);
  });
});
