import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeService } from '../../core/services/theme.service';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  let fixture: ComponentFixture<ThemeToggle>;
  let theme: ThemeService;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [ThemeToggle] }).compileComponents();
    theme = TestBed.inject(ThemeService);
    theme.setPreference('light');
    fixture = TestBed.createComponent(ThemeToggle);
    await fixture.whenStable();
    button = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => localStorage.clear());

  it('shows the moon in light mode and offers to switch to dark', () => {
    expect(button.classList).not.toContain('is-dark');
    expect(button.getAttribute('aria-label')).toBe('Cambiar a modo oscuro');
  });

  it('switches to dark on click and shows the sun', async () => {
    button.click();
    await fixture.whenStable();

    expect(theme.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(button.classList).toContain('is-dark');
    expect(button.getAttribute('aria-label')).toBe('Cambiar a modo claro');
  });

  it('goes back to light with a second click', async () => {
    button.click();
    await fixture.whenStable();
    button.click();
    await fixture.whenStable();
    expect(theme.theme()).toBe('light');
  });

  it('gives each button its own SVG mask id', () => {
    const other = TestBed.createComponent(ThemeToggle);
    other.detectChanges();
    const idA = fixture.nativeElement.querySelector('mask').id;
    const idB = other.nativeElement.querySelector('mask').id;
    expect(idA).not.toBe(idB);
    // El círculo usa la máscara de su propio botón
    expect(fixture.nativeElement.querySelector('.centro').getAttribute('mask')).toBe(`url(#${idA})`);
  });
});
