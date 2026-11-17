import { TestBed } from '@angular/core/testing';
import { CalorieRing } from './calorie-ring';

describe('CalorieRing', () => {
  function create(value: number, max: number) {
    const fixture = TestBed.createComponent(CalorieRing);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('max', max);
    fixture.detectChanges();
    return fixture;
  }

  it('calculates the progress percentage', () => {
    expect(create(1100, 2200).componentInstance.progress()).toBe(0.5);
  });

  it('never goes over 100%', () => {
    expect(create(3000, 2200).componentInstance.progress()).toBe(1);
  });

  it('returns 0 when the goal is 0', () => {
    expect(create(500, 0).componentInstance.progress()).toBe(0);
  });

  it('renders two circles', () => {
    const el = create(950, 2200).nativeElement as HTMLElement;
    expect(el.querySelectorAll('circle').length).toBe(2);
  });
});
