import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TIPS, tipIndexFor } from '../../core/data/tips';
import { DailyTip } from './daily-tip';

describe('DailyTip', () => {
  let fixture: ComponentFixture<DailyTip>;
  let el: HTMLElement;
  const monday = new Date(2026, 10, 16, 9, 0);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DailyTip] }).compileComponents();
    fixture = TestBed.createComponent(DailyTip);
    fixture.componentRef.setInput('date', monday);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  const text = () => el.querySelector('.consejo-texto')?.textContent?.trim();
  const icon = () => el.querySelector('.consejo-icono');
  const nextButton = () =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Otro consejo'))!;

  async function next(times = 1) {
    for (let i = 0; i < times; i++) nextButton().click();
    await fixture.whenStable();
  }

  it('shows the tip of the day with its title, icon and category color', () => {
    const tip = TIPS[tipIndexFor(monday, TIPS.length)];
    expect(el.querySelector('h2')?.textContent).toContain('Consejo del día');
    expect(text()).toBe(tip.text);
    expect(icon()?.classList).toContain(`consejo-${tip.category}`);
    expect(icon()?.querySelector('i')?.classList).toContain(tip.icon);
    expect(el.querySelector('.consejo-texto')?.getAttribute('aria-live')).toBe('polite');
  });

  it('goes to the next tip with "Otro consejo"', async () => {
    const start = tipIndexFor(monday, TIPS.length);
    await next();
    expect(text()).toBe(TIPS[(start + 1) % TIPS.length].text);
  });

  it('goes back to the first tip after the last one', async () => {
    const start = tipIndexFor(monday, TIPS.length);
    await next(TIPS.length - start); // llega justo al final y da la vuelta
    expect(text()).toBe(TIPS[0].text);
    await next(start); // una vuelta completa: vuelve al consejo del día
    expect(text()).toBe(TIPS[start].text);
  });

  it('keeps the chosen tip when only the minute changes', async () => {
    const start = tipIndexFor(monday, TIPS.length);
    await next();
    fixture.componentRef.setInput('date', new Date(2026, 10, 16, 9, 1));
    await fixture.whenStable();
    expect(text()).toBe(TIPS[(start + 1) % TIPS.length].text);
  });

  it('shows the new day tip after midnight', async () => {
    await next(3);
    const tuesday = new Date(2026, 10, 17, 0, 0);
    fixture.componentRef.setInput('date', tuesday);
    await fixture.whenStable();
    expect(text()).toBe(TIPS[tipIndexFor(tuesday, TIPS.length)].text);
  });
});
