import { Injectable, computed, signal } from '@angular/core';
import { STORAGE_PREFIX, readStorage, writeStorage } from '../utils/storage';

/** Usuario con sesión iniciada. */
export interface AuthUser {
  name: string;
  email: string;
}

/**
 * Cuenta guardada en localStorage. La contraseña NUNCA se guarda: solo su "huella"
 * (hash SHA-256 de salt + contraseña) y el salt aleatorio de esa cuenta, en hexadecimal.
 */
export interface StoredAccount {
  name: string;
  salt: string;
  passwordHash: string;
}

/** Cuentas por correo. Las cuentas viejas (de antes de este cambio) son solo el nombre (texto). */
type Accounts = Record<string, StoredAccount | string>;

export type RegisterResult = { ok: true } | { ok: false; error: 'email-taken' };
export type LoginError = 'not-found' | 'wrong-password';
export type LoginResult = { ok: true } | { ok: false; error: LoginError };

const SESSION_KEY = `${STORAGE_PREFIX}session`;
const USERS_KEY = `${STORAGE_PREFIX}users`;

/*
 * OJO: la app NO tiene backend. Todo (cuentas, hashes y datos) vive en el localStorage
 * de este navegador, así que esto NO es seguridad real: cualquiera con acceso al
 * computador puede ver o borrar esos datos. El hash sirve para que la app se comporte
 * como una de verdad (pide la contraseña correcta y no la guarda en texto plano).
 */

/** Bytes → texto hexadecimal ("0a1f..."). */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Salt aleatorio de 16 bytes, distinto para cada cuenta (API del navegador). */
function newSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

/** Hash SHA-256 de salt + contraseña, calculado en el navegador con crypto.subtle. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

const normalize = (email: string) => email.trim().toLowerCase();

/**
 * Sesión del usuario, solo en el frontend (no hay backend).
 * Se guarda en localStorage para que sobreviva a un F5.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<AuthUser | null>(readStorage<AuthUser>(SESSION_KEY));

  /** Usuario actual (solo lectura); null si no hay sesión. */
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  /**
   * Crea la cuenta con la contraseña protegida con hash e inicia sesión.
   * Si ese correo ya tiene cuenta NO cambia nada ni entra (antes le cambiaba el nombre).
   */
  async register(name: string, email: string, password: string): Promise<RegisterResult> {
    const user = { name: name.trim(), email: normalize(email) };
    if (this.readAccounts()[user.email]) return { ok: false, error: 'email-taken' };

    await this.saveAccount(user.email, user.name, password);
    this.setUser(user);
    return { ok: true };
  }

  /**
   * Inicia sesión SOLO si el correo está registrado y la contraseña coincide:
   * se calcula el hash de lo que escribió (con el salt de esa cuenta) y se compara.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const clean = normalize(email);
    const account = this.readAccounts()[clean];
    if (!account) return { ok: false, error: 'not-found' };

    // MIGRACIÓN: cuenta vieja (solo el nombre, sin contraseña guardada).
    // Se acepta la contraseña que escriba y desde ahora se le guarda su hash:
    // así nadie pierde su cuenta ni sus datos (bocado-sano.data.<correo>).
    if (typeof account === 'string') {
      await this.saveAccount(clean, account, password);
      this.setUser({ name: account, email: clean });
      return { ok: true };
    }

    const hash = await hashPassword(password, account.salt);
    if (hash !== account.passwordHash) return { ok: false, error: 'wrong-password' };

    this.setUser({ name: account.name, email: clean });
    return { ok: true };
  }

  /** Cambia SOLO el nombre de la cuenta actual (lo usa Perfil); la contraseña no se toca. */
  updateName(name: string): void {
    const current = this._user();
    if (!current) return;
    const clean = name.trim();
    const accounts = this.readAccounts();
    const account = accounts[current.email];
    // Cuenta nueva: se cambia el nombre y se conservan salt y hash
    accounts[current.email] =
      account && typeof account !== 'string' ? { ...account, name: clean } : clean;
    writeStorage(USERS_KEY, accounts);
    this.setUser({ ...current, name: clean });
  }

  logout(): void {
    this.setUser(null);
  }

  /** Guarda la cuenta con un salt nuevo y el hash de su contraseña. */
  private async saveAccount(email: string, name: string, password: string): Promise<void> {
    const salt = newSalt();
    const passwordHash = await hashPassword(password, salt);
    // Se vuelve a leer después del await, por si algo cambió mientras se calculaba el hash
    const accounts = this.readAccounts();
    accounts[email] = { name, salt, passwordHash };
    writeStorage(USERS_KEY, accounts);
  }

  private readAccounts(): Accounts {
    return readStorage<Accounts>(USERS_KEY) ?? {};
  }

  private setUser(user: AuthUser | null): void {
    this._user.set(user);
    writeStorage(SESSION_KEY, user);
  }
}
