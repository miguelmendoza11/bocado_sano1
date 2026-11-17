import { TestBed } from '@angular/core/testing';
import { ConfettiService } from '../../core/services/confetti.service';
import { Confetti } from './confetti';

describe('Confetti', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Confetti] }).compileComponents();
  });

  it('draws nothing until confetti is launched', async () => {
    const fixture = TestBed.createComponent(Confetti);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.papelito').length).toBe(0);
  });

  it('draws every piece with its color, shape and position', async () => {
    const fixture = TestBed.createComponent(Confetti);
    const service = TestBed.inject(ConfettiService);
    service.launch();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const pieces = el.querySelectorAll<HTMLElement>('.papelito');
    expect(pieces.length).toBe(60);

    const first = service.bursts()[0].pieces[0];
    expect(pieces[0].classList).toContain(first.color);
    expect(pieces[0].classList).toContain(first.shape);
    expect(pieces[0].style.left).toBe(`${first.left}%`);
    expect(pieces[0].style.getPropertyValue('--drift')).toBe(`${first.drift}px`);
  });

  it('is hidden from screen readers', () => {
    const fixture = TestBed.createComponent(Confetti);
    expect(fixture.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });
});
