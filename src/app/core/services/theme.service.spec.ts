import { TestBed } from '@angular/core/testing';
import { THEME_KEY, ThemeService } from './theme.service';

/** matchMedia falso: jsdom no lo trae. Permite simular que el sistema cambia de modo. */
function mockSystemDark(initial: boolean) {
  let listener: ((e: { matches: boolean }) => void) | undefined;
  const media = {
    matches: initial,
    addEventListener: (_: string, fn: typeof listener) => (listener = fn),
    removeEventListener: () => (listener = undefined),
  };
  vi.stubGlobal('matchMedia', () => media);
  return {
    change(matches: boolean) {
      media.matches = matches;
      listener?.({ matches });
    },
  };
}

describe('ThemeService', () => {
  const html = document.documentElement;

  function create() {
    const service = TestBed.inject(ThemeService);
    TestBed.tick(); // ejecuta el effect que aplica el tema en <html>
    return service;
  }

  beforeEach(() => {
    localStorage.clear();
    html.removeAttribute('data-bs-theme');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('follows the system by default', () => {
    mockSystemDark(true);
    const service = create();
    expect(service.preference()).toBe('system');
    expect(service.theme()).toBe('dark');
    expect(html.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('updates when the system mode changes while the app is open', () => {
    const system = mockSystemDark(false);
    const service = create();
    expect(service.theme()).toBe('light');

    system.change(true);
    TestBed.tick();
    expect(service.theme()).toBe('dark');
    expect(html.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('applies and saves an explicit choice', () => {
    mockSystemDark(false);
    const service = create();
    service.setPreference('dark');
    TestBed.tick();

    expect(html.getAttribute('data-bs-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('ignores the system when the user chose light', () => {
    const system = mockSystemDark(true);
    const service = create();
    service.setPreference('light');
    system.change(true);
    TestBed.tick();
    expect(service.theme()).toBe('light');
  });

  it('remembers the saved preference', () => {
    mockSystemDark(false);
    localStorage.setItem(THEME_KEY, 'dark');
    expect(create().theme()).toBe('dark');
  });

  it('falls back to system with an invalid saved value', () => {
    mockSystemDark(false);
    localStorage.setItem(THEME_KEY, 'purple');
    expect(create().preference()).toBe('system');
  });

  it('toggle switches to the opposite of what is shown', () => {
    mockSystemDark(true);
    const service = create();
    service.toggle();
    expect(service.theme()).toBe('light');
    service.toggle();
    expect(service.theme()).toBe('dark');
  });
});
