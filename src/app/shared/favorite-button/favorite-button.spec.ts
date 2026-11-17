import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FavoritesService } from '../../core/services/favorites.service';
import { ToastService } from '../../core/services/toast.service';
import { FavoriteButton, FavoriteChange } from './favorite-button';

describe('FavoriteButton', () => {
  let fixture: ComponentFixture<FavoriteButton>;
  let favorites: FavoritesService;
  let toast: ToastService;
  let button: HTMLButtonElement;
  const icon = () => button.querySelector('i')!;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [FavoriteButton] }).compileComponents();
    favorites = TestBed.inject(FavoritesService);
    toast = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(FavoriteButton);
    fixture.componentRef.setInput('recipeId', 3);
    await fixture.whenStable();
    button = fixture.nativeElement.querySelector('button');
  });

  afterEach(() => localStorage.clear());

  async function click() {
    button.click();
    await fixture.whenStable();
  }

  it('starts as an empty heart that offers to add', () => {
    expect(icon().classList).toContain('bi-heart');
    expect(icon().classList).not.toContain('bi-heart-fill');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Agregar a favoritas');
  });

  it('fills the heart and saves the favorite on click', async () => {
    await click();
    expect(favorites.isFavorite(3)).toBe(true);
    expect(icon().classList).toContain('bi-heart-fill');
    expect(button.classList).toContain('is-fav');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Quitar de favoritas');
  });

  it('empties the heart with a second click', async () => {
    await click();
    await click();
    expect(favorites.isFavorite(3)).toBe(false);
    expect(icon().classList).toContain('bi-heart');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('emits favoriteChange to the parent when adding and when removing', async () => {
    const emitted: FavoriteChange[] = [];
    fixture.componentInstance.favoriteChange.subscribe((change) => emitted.push(change));

    await click();
    await click();
    expect(emitted).toEqual([
      { recipeId: 3, favorite: true },
      { recipeId: 3, favorite: false },
    ]);
  });

  it('does not show a toast by itself (the parent decides)', async () => {
    const success = vi.spyOn(toast, 'success');
    const info = vi.spyOn(toast, 'info');
    await click();
    await click();
    expect(success).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
  });

  it('pops only when adding and stops when the animation ends', async () => {
    await click();
    expect(button.classList).toContain('pop');

    icon().dispatchEvent(new Event('animationend'));
    await fixture.whenStable();
    expect(button.classList).not.toContain('pop');

    await click(); // quitar: sin pop
    expect(button.classList).not.toContain('pop');
  });

  it('updates when the favorite changes from somewhere else', async () => {
    favorites.toggle(3);
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
});
