import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard } from './auth.guard';

describe('auth guards', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => localStorage.clear());

  /** Ejecuta un guard dentro del contexto de inyección de Angular. */
  const run = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() => guard({} as never, {} as never));

  const urlOf = (result: unknown) => router.serializeUrl(result as UrlTree);

  describe('authGuard', () => {
    it('redirects to /bienvenida without a session', () => {
      expect(urlOf(run(authGuard))).toBe('/bienvenida');
    });

    it('lets the user in with a session', () => {
      auth.login('ana@correo.com');
      expect(run(authGuard)).toBe(true);
    });
  });

  describe('guestGuard', () => {
    it('lets the user in without a session', () => {
      expect(run(guestGuard)).toBe(true);
    });

    it('redirects to /inicio with a session', () => {
      auth.login('ana@correo.com');
      expect(urlOf(run(guestGuard))).toBe('/inicio');
    });

    it('lets the user in again after logout', () => {
      auth.login('ana@correo.com');
      auth.logout();
      expect(run(guestGuard)).toBe(true);
    });
  });
});
