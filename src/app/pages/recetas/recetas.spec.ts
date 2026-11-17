import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { FavoritesService } from '../../core/services/favorites.service';
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

  describe('favorites', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    /** setup() + atajos para el corazón y la pestaña "Favoritas". */
    function setupFavs(favoriteIds: number[] = []) {
      const favorites = TestBed.inject(FavoritesService);
      favoriteIds.forEach((id) => favorites.toggle(id));
      const ui = setup();
      const favTab = () => ui.el.querySelector<HTMLButtonElement>('.tab-fav')!;
      const hearts = () => [...ui.el.querySelectorAll<HTMLButtonElement>('.receta-fav button')];
      const openFavorites = () => {
        favTab().click();
        ui.fixture.detectChanges();
      };
      return { ...ui, favorites, favTab, hearts, openFavorites };
    }

    const clean = (text: string | null | undefined) => text?.replace(/\s+/g, ' ').trim();

    it('should put one heart per card, outside the link', () => {
      const { hearts, cards } = setupFavs();
      expect(hearts().length).toBe(8);
      expect(hearts().every((b) => b.closest('a') === null)).toBe(true);
      // Cada corazón está junto a su tarjeta, dentro del mismo contenedor
      expect(hearts()[0].closest('.receta-tile')!.contains(cards()[0])).toBe(true);
    });

    it('should not open the recipe when the heart is clicked', () => {
      const { fixture, hearts, favorites } = setupFavs();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl');

      hearts()[2].click();
      fixture.detectChanges();

      expect(navigate).not.toHaveBeenCalled();
      expect(favorites.isFavorite(3)).toBe(true);
      expect(hearts()[2].getAttribute('aria-pressed')).toBe('true');
    });

    it('should describe each heart with the name of its recipe', () => {
      const { el, hearts } = setupFavs();
      const id = hearts()[0].getAttribute('aria-describedby')!;
      expect(el.querySelector('#' + id)?.textContent?.trim()).toBe('Pancakes de avena y banano');
    });

    it('should place the "Favoritas" tab right after "Todas"', () => {
      const { el } = setupFavs();
      const labels = [...el.querySelectorAll('.categorias .tab')].map((b) => clean(b.textContent));
      expect(labels.slice(0, 3)).toEqual(['Todas', 'Favoritas', 'Desayuno']);
    });

    it('should show the counter only when there are favorites', () => {
      const { fixture, favTab, favorites } = setupFavs();
      expect(favTab().querySelector('.tab-count')).toBeNull();

      favorites.toggle(5);
      favorites.toggle(7);
      fixture.detectChanges();
      expect(clean(favTab().textContent)).toBe('Favoritas (2)');
    });

    it('should show only the favorites in the "Favoritas" tab', () => {
      const { openFavorites, names, favTab, tab } = setupFavs([7, 5]);
      openFavorites();
      expect(names()).toEqual(['Salmón al horno con verduras', 'Hummus con bastones de zanahoria']);
      expect(favTab().getAttribute('aria-pressed')).toBe('true');
      expect(tab('Todas').getAttribute('aria-pressed')).toBe('false');
    });

    it('should combine the "Favoritas" tab with the search', () => {
      const { openFavorites, search, names, el } = setupFavs([5, 7]);
      openFavorites();
      search('hummus');
      expect(names()).toEqual(['Hummus con bastones de zanahoria']);

      search('pancakes'); // existe, pero no es favorita
      expect(names()).toEqual([]);
      expect(el.textContent).toContain('No encontramos recetas');
    });

    it('should show the empty state when there are no favorites', () => {
      const { openFavorites, cards, el } = setupFavs();
      openFavorites();
      expect(cards().length).toBe(0);
      expect(el.querySelector('.sin-favoritas')?.textContent).toContain('Aún no tienes favoritas');
      expect(el.querySelector('.sin-favoritas .bi-heart')).not.toBeNull();
    });

    it('should show the empty state after removing the last favorite in that tab', () => {
      const { fixture, openFavorites, hearts, cards, el } = setupFavs([3]);
      openFavorites();
      expect(cards().length).toBe(1);

      hearts()[0].click();
      fixture.detectChanges();

      expect(cards().length).toBe(0);
      expect(el.querySelector('.sin-favoritas')).not.toBeNull();
    });

    it('should go back to all recipes with "Ver todas"', () => {
      const { fixture, openFavorites, el, cards, tab } = setupFavs();
      openFavorites();
      el.querySelector<HTMLButtonElement>('.sin-favoritas button')!.click();
      fixture.detectChanges();
      expect(cards().length).toBe(8);
      expect(tab('Todas').classList).toContain('active');
    });
  });
});
