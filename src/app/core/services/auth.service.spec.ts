import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  it('starts without a session', () => {
    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('logs in after register and saves the session', () => {
    service.register(' Juan ', 'Juan@Mail.com');
    expect(service.user()).toEqual({ name: 'Juan', email: 'juan@mail.com' });
    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.getItem('bocado-sano.session')).toContain('juan@mail.com');
  });

  it('uses the registered name on login', () => {
    service.register('Juan', 'juan@mail.com');
    service.logout();
    service.login('juan@mail.com');
    expect(service.user()?.name).toBe('Juan');
  });

  it('uses the part before @ when the email was not registered', () => {
    service.login('ana.gomez@mail.com');
    expect(service.user()).toEqual({ name: 'ana.gomez', email: 'ana.gomez@mail.com' });
  });

  it('clears the session on logout', () => {
    service.login('ana@mail.com');
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('bocado-sano.session')).toBeNull();
  });

  it('restores the session after a reload', () => {
    service.login('ana@mail.com');
    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(AuthService);
    expect(reloaded.user()?.email).toBe('ana@mail.com');
  });
});
