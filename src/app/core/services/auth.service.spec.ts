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

  it('logs in after register and saves the session', async () => {
    await service.register(' Juan ', 'Juan@Mail.com', 'secreto123');
    expect(service.user()).toEqual({ name: 'Juan', email: 'juan@mail.com' });
    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.getItem('bocado-sano.session')).toContain('juan@mail.com');
  });

  it('logs in with the right password and uses the registered name', async () => {
    await service.register('Juan', 'juan@mail.com', 'secreto123');
    service.logout();
    expect(await service.login('juan@mail.com', 'secreto123')).toEqual({ ok: true });
    expect(service.user()).toEqual({ name: 'Juan', email: 'juan@mail.com' });
  });

  it('rejects a wrong password', async () => {
    await service.register('Juan', 'juan@mail.com', 'secreto123');
    service.logout();
    expect(await service.login('juan@mail.com', 'otra-clave')).toEqual({
      ok: false,
      error: 'wrong-password',
    });
    expect(service.isLoggedIn()).toBe(false);
  });

  it('rejects an email that was never registered', async () => {
    expect(await service.login('nadie@noexiste.test', 'secreto123')).toEqual({
      ok: false,
      error: 'not-found',
    });
    expect(service.isLoggedIn()).toBe(false);
  });

  it('accepts the email with capital letters or spaces', async () => {
    await service.register('Juan', 'juan@mail.com', 'secreto123');
    service.logout();
    expect(await service.login('  JUAN@Mail.com ', 'secreto123')).toEqual({ ok: true });
    expect(service.user()?.email).toBe('juan@mail.com');
  });

  it('clears the session on logout', async () => {
    await service.register('Ana', 'ana@mail.com', 'secreto123');
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('bocado-sano.session')).toBeNull();
  });

  it('saves a salt and a hash, never the password', async () => {
    await service.register('Juan', 'juan@mail.com', 'secreto123');
    const raw = localStorage.getItem('bocado-sano.users')!;
    expect(raw).not.toContain('secreto123');
    const account = JSON.parse(raw)['juan@mail.com'];
    expect(account.name).toBe('Juan');
    expect(account.salt).toMatch(/^[0-9a-f]{32}$/);
    expect(account.passwordHash).toMatch(/^[0-9a-f]{64}$/); // SHA-256 en hexadecimal
  });

  it('uses a different salt for each account', async () => {
    await service.register('Juan', 'juan@mail.com', 'secreto123');
    await service.register('Ana', 'ana@mail.com', 'secreto123');
    const users = JSON.parse(localStorage.getItem('bocado-sano.users')!);
    expect(users['juan@mail.com'].salt).not.toBe(users['ana@mail.com'].salt);
    expect(users['juan@mail.com'].passwordHash).not.toBe(users['ana@mail.com'].passwordHash);
  });

  it('changes only the name with updateName and keeps the password hash', async () => {
    await service.register('Juan', 'juan@mail.com', 'secreto123');
    const before = JSON.parse(localStorage.getItem('bocado-sano.users')!)['juan@mail.com'];
    service.updateName('Juan Carlos');
    const after = JSON.parse(localStorage.getItem('bocado-sano.users')!)['juan@mail.com'];
    expect(after).toEqual({ ...before, name: 'Juan Carlos' });
    expect(service.user()?.name).toBe('Juan Carlos');
  });

  it('does not change anything when the email is already registered', async () => {
    await service.register('Juan', 'juan@mail.com', 'secreto123');
    service.logout();
    const before = localStorage.getItem('bocado-sano.users');

    expect(await service.register('Otro', ' JUAN@mail.com ', 'otra-clave')).toEqual({
      ok: false,
      error: 'email-taken',
    });
    expect(localStorage.getItem('bocado-sano.users')).toBe(before);
    expect(service.isLoggedIn()).toBe(false);
    // La contraseña de siempre sigue funcionando
    expect(await service.login('juan@mail.com', 'secreto123')).toEqual({ ok: true });
    expect(service.user()?.name).toBe('Juan');
  });

  describe('old accounts (saved before passwords)', () => {
    /** Así guardaba las cuentas la versión anterior: { correo: "Nombre" }. */
    const saveOldAccount = () =>
      localStorage.setItem('bocado-sano.users', JSON.stringify({ 'vieja@mail.com': 'Rosa' }));

    it('lets the old account in with the password it types and saves its hash', async () => {
      saveOldAccount();
      expect(await service.login('vieja@mail.com', 'nueva-clave')).toEqual({ ok: true });
      expect(service.user()).toEqual({ name: 'Rosa', email: 'vieja@mail.com' });

      const account = JSON.parse(localStorage.getItem('bocado-sano.users')!)['vieja@mail.com'];
      expect(account.name).toBe('Rosa');
      expect(account.passwordHash).toMatch(/^[0-9a-f]{64}$/);
      expect(localStorage.getItem('bocado-sano.users')).not.toContain('nueva-clave');
    });

    it('asks for that same password from then on', async () => {
      saveOldAccount();
      await service.login('vieja@mail.com', 'nueva-clave');
      service.logout();

      expect(await service.login('vieja@mail.com', 'otra-cosa')).toEqual({
        ok: false,
        error: 'wrong-password',
      });
      expect(await service.login('vieja@mail.com', 'nueva-clave')).toEqual({ ok: true });
    });

    it('does not let someone register over an old account', async () => {
      saveOldAccount();
      expect(await service.register('Otra', 'vieja@mail.com', 'secreto123')).toEqual({
        ok: false,
        error: 'email-taken',
      });
    });

    it('keeps the old account when its name changes before having a password', () => {
      saveOldAccount();
      localStorage.setItem(
        'bocado-sano.session',
        JSON.stringify({ name: 'Rosa', email: 'vieja@mail.com' }),
      );
      TestBed.resetTestingModule();
      const reloaded = TestBed.inject(AuthService); // sesión abierta desde antes del cambio
      reloaded.updateName('Rosa María');
      expect(JSON.parse(localStorage.getItem('bocado-sano.users')!)['vieja@mail.com']).toBe(
        'Rosa María',
      );
    });
  });

  it('restores the session after a reload', async () => {
    await service.register('Ana', 'ana@mail.com', 'secreto123');
    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(AuthService);
    expect(reloaded.user()?.email).toBe('ana@mail.com');
  });
});
