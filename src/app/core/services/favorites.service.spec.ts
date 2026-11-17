import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { FavoritesService, favoritesKey } from './favorites.service';

describe('FavoritesService', () => {
  const ANA = 'ana@correo.test';
  const PEDRO = 'pedro@correo.test';
  const PASSWORD = 'secreto123';

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  /** Simula abrir la app (o recargar con F5): servicios nuevos que leen localStorage. */
  function openApp() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return { auth: TestBed.inject(AuthService), favorites: TestBed.inject(FavoritesService) };
  }

  const saved = (email: string) => JSON.parse(localStorage.getItem(favoritesKey(email)) ?? 'null');

  it('adds and removes a favorite with toggle', async () => {
    const { auth, favorites } = openApp();
    await auth.register('Ana', ANA, PASSWORD);

    expect(favorites.toggle(3)).toBe(true);
    expect(favorites.isFavorite(3)).toBe(true);
    expect(favorites.count()).toBe(1);

    expect(favorites.toggle(3)).toBe(false);
    expect(favorites.isFavorite(3)).toBe(false);
    expect(favorites.count()).toBe(0);
  });

  it('saves the favorites of each user under their email', async () => {
    const { auth, favorites } = openApp();
    await auth.register('Ana', ANA, PASSWORD);
    favorites.toggle(5);
    favorites.toggle(1);
    expect(saved(ANA)).toEqual([1, 5]);
  });

  it('starts empty for a new account', async () => {
    const { auth, favorites } = openApp();
    await auth.register('Ana', ANA, PASSWORD);
    expect(favorites.count()).toBe(0);
    expect(saved(ANA)).toBeNull();
  });

  it('does not show the favorites of another account', async () => {
    const { auth, favorites } = openApp();
    await auth.register('Ana', ANA, PASSWORD);
    favorites.toggle(5);

    auth.logout();
    await auth.register('Pedro', PEDRO, PASSWORD);
    expect(favorites.count()).toBe(0);

    favorites.toggle(2);
    expect(saved(PEDRO)).toEqual([2]);
    expect(saved(ANA)).toEqual([5]); // lo de Ana no se tocó
  });

  it('keeps the favorites after logging in again and after a reload', async () => {
    let app = openApp();
    await app.auth.register('Ana', ANA, PASSWORD);
    app.favorites.toggle(4);
    app.auth.logout();
    expect(app.favorites.count()).toBe(0); // sin sesión no se ve nada

    await app.auth.login(ANA, PASSWORD);
    expect(app.favorites.isFavorite(4)).toBe(true);

    app = openApp(); // F5: la sesión sigue
    expect(app.favorites.isFavorite(4)).toBe(true);
  });

  it('ignores saved ids that no longer exist and invalid data', async () => {
    localStorage.setItem(favoritesKey(ANA), JSON.stringify([3, 999, 'x', 7]));
    const { auth, favorites } = openApp();
    await auth.register('Ana', ANA, PASSWORD);
    // register solo crea la cuenta si no existe; la clave de favoritas ya estaba
    expect([...favorites.ids()]).toEqual([3, 7]);

    expect(favorites.toggle(999)).toBe(false);
    expect(favorites.count()).toBe(2);
  });

  it('starts empty when the saved value is corrupt', async () => {
    localStorage.setItem(favoritesKey(ANA), '{no es json');
    const { auth, favorites } = openApp();
    await auth.register('Ana', ANA, PASSWORD);
    expect(favorites.count()).toBe(0);
  });
});
