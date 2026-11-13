import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Recetas } from './recetas';

describe('Recetas', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recetas],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(Recetas);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const cards = () => el.querySelectorAll<HTMLAnchorElement>('a.receta-card');
    const names = () => [...el.querySelectorAll('.receta-nombre')].map((n) => n.textContent?.trim());
    const tab = (label: string) =>
      [...el.querySelectorAll<HTMLButtonElement>('button.tab')].find((b) => b.textContent?.trim() === label)!;
    const search = (text: string) => {
      const input = el.querySelector<HTMLInputElement>('input[type="search"]')!;
      input.value = text;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    return { fixture, el, cards, names, tab, search };
  }

  it('should show the 8 recipes', () => {
    const { cards } = setup();
    expect(cards().length).toBe(8);
  });

  it('should link every card to its detail page', () => {
    const { cards } = setup();
    expect(cards()[0].getAttribute('href')).toBe('/recetas/1');
    expect(cards()[7].getAttribute('href')).toBe('/recetas/8');
  });

  it('should start with the "Todas" tab active', () => {
    const { tab } = setup();
    expect(tab('Todas').classList).toContain('active');
    expect(tab('Todas').getAttribute('aria-pressed')).toBe('true');
  });

  it('should filter by category when a tab is clicked', () => {
    const { fixture, tab, cards, names } = setup();
    tab('Snacks').click();
    fixture.detectChanges();
    expect(cards().length).toBe(2);
    expect(names()).toEqual(['Hummus con bastones de zanahoria', 'Batido verde de espinaca y mango']);
    expect(tab('Snacks').classList).toContain('active');
    expect(tab('Todas').classList).not.toContain('active');
  });

  it('should filter by the search text', () => {
    const { search, names } = setup();
    search('salmon');
    expect(names()).toEqual(['Salmón al horno con verduras']);
  });

  it('should show a message when nothing matches and reset with "Ver todas"', () => {
    const { fixture, el, search, cards } = setup();
    search('xyz');
    expect(cards().length).toBe(0);
    expect(el.textContent).toContain('No encontramos recetas');

    const reset = [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Ver todas'))!;
    reset.click();
    fixture.detectChanges();
    expect(cards().length).toBe(8);
    expect(el.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('');
  });

  it('should show a photo with its description in every card', () => {
    const { cards } = setup();
    const first = cards()[0].querySelector('img.receta-foto')!;
    expect(first.getAttribute('src')).toContain('recetas/pancakes-avena-banano.jpg');
    expect(first.getAttribute('alt')).toBe(
      'Pila de pancakes con miel, arándanos y rodajas de banano en un plato rojo',
    );
    // Todas las tarjetas tienen foto y ninguna muestra el emoji
    expect([...cards()].every((c) => c.querySelector('img.receta-foto'))).toBe(true);
    expect(cards()[0].querySelector('.receta-emoji')).toBeNull();
  });

  it('should show the emoji only in the card whose photo fails to load', () => {
    const { fixture, cards } = setup();
    cards()[1].querySelector('img')!.dispatchEvent(new Event('error')); // yogur
    fixture.detectChanges();

    expect(cards()[1].querySelector('img')).toBeNull();
    expect(cards()[1].querySelector('.receta-emoji')?.textContent).toBe('🍓');
    // Las demás siguen con su foto
    expect(cards()[0].querySelector('img.receta-foto')).not.toBeNull();
  });

  it('should keep the emoji after filtering if the photo already failed', () => {
    const { fixture, cards, tab } = setup();
    cards()[6].querySelector('img')!.dispatchEvent(new Event('error')); // hummus
    fixture.detectChanges();

    tab('Snacks').click();
    fixture.detectChanges();
    expect(cards()[0].querySelector('.receta-emoji')?.textContent).toBe('🥕');
    expect(cards()[1].querySelector('img.receta-foto')).not.toBeNull();
  });
});
