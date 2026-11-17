import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaterGlass } from './water-glass';

describe('WaterGlass', () => {
  let fixture: ComponentFixture<WaterGlass>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WaterGlass] }).compileComponents();
    fixture = TestBed.createComponent(WaterGlass);
    el = fixture.nativeElement;
  });

  /** Pone el porcentaje y devuelve cuánto baja el agua (px del translateY). */
  async function offsetAt(percent: number): Promise<number> {
    fixture.componentRef.setInput('percent', percent);
    await fixture.whenStable();
    const transform = el.querySelector<SVGGElement>('.agua')!.style.transform;
    return Number(transform.match(/translateY\(([-\d.]+)px\)/)![1]);
  }

  it('fills the glass according to the percent', async () => {
    expect(await offsetAt(100)).toBe(0); // lleno
    expect(await offsetAt(50)).toBe(27.5); // la mitad de 55
    expect(await offsetAt(20)).toBe(44);
  });

  it('hides even the wave crest when the glass is empty', async () => {
    expect(await offsetAt(0)).toBe(59); // 55 de alto + 4 de margen
  });

  it('keeps the level between 0 and 100', async () => {
    expect(await offsetAt(250)).toBe(0); // pasarse de la meta no desborda el vaso
    expect(await offsetAt(-30)).toBe(59);
  });

  it('draws two waves clipped by the glass shape', async () => {
    await offsetAt(50);
    expect(el.querySelectorAll('.ola').length).toBe(2);
    const clipId = el.querySelector('clipPath')!.id;
    expect(el.querySelector('[clip-path]')!.getAttribute('clip-path')).toBe(`url(#${clipId})`);
  });

  it('gives every glass its own clip id', async () => {
    const other = TestBed.createComponent(WaterGlass);
    other.componentRef.setInput('percent', 10);
    await offsetAt(10);
    await other.whenStable();
    const otherEl = other.nativeElement as HTMLElement;
    expect(el.querySelector('clipPath')!.id).not.toBe(otherEl.querySelector('clipPath')!.id);
  });
});
