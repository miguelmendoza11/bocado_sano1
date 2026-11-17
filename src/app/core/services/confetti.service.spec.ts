import { TestBed } from '@angular/core/testing';
import { ConfettiService } from './confetti.service';

describe('ConfettiService', () => {
  let service: ConfettiService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfettiService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('launches a burst of 60 pieces with valid values', () => {
    service.launch();
    const [burst] = service.bursts();
    expect(burst.pieces.length).toBe(60);
    for (const p of burst.pieces) {
      expect(p.left).toBeGreaterThanOrEqual(0);
      expect(p.left).toBeLessThanOrEqual(100);
      expect(p.delay).toBeLessThanOrEqual(0.6);
      expect(p.duration).toBeGreaterThanOrEqual(1.8);
      expect(p.duration).toBeLessThanOrEqual(2.6);
      expect(Math.abs(p.spin)).toBeGreaterThanOrEqual(360);
      expect(['lime', 'orange', 'blue', 'lime-strong']).toContain(p.color);
      expect(['rect', 'circle']).toContain(p.shape);
    }
  });

  it('removes the burst when it finishes', () => {
    service.launch();
    vi.advanceTimersByTime(3100);
    expect(service.bursts().length).toBe(1);
    vi.advanceTimersByTime(200);
    expect(service.bursts().length).toBe(0);
  });

  it('keeps at most two bursts at the same time', () => {
    service.launch();
    service.launch();
    service.launch();
    const ids = service.bursts().map((b) => b.id);
    expect(ids).toEqual([2, 3]); // se fue la más vieja
  });

  it('does nothing when the user prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    service.launch();
    expect(service.bursts()).toEqual([]);
  });
});
