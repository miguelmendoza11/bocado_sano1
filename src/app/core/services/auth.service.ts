import { Injectable, computed, signal } from '@angular/core';

/** Usuario con sesión iniciada. */
export interface AuthUser {
  name: string;
  email: string;
}

const SESSION_KEY = 'bocado-sano.session';
const USERS_KEY = 'bocado-sano.users';

/** Lee un JSON de localStorage. Si falla (modo privado, dato roto...) devuelve null. */
function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Guarda (o borra, si value es null) un JSON en localStorage sin romper la app si falla. */
function writeStorage(key: string, value: unknown): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Sin localStorage la sesión solo dura hasta recargar la página.
  }
}

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

  /** Crea la cuenta (recuerda el nombre de ese correo) e inicia sesión. */
  register(name: string, email: string): void {
    const user = { name: name.trim(), email: normalize(email) };
    const users = readStorage<Record<string, string>>(USERS_KEY) ?? {};
    users[user.email] = user.name;
    writeStorage(USERS_KEY, users);
    this.setUser(user);
  }

  /** Inicia sesión: usa el nombre registrado con ese correo, o la parte antes de la @. */
  login(email: string): void {
    const clean = normalize(email);
    const users = readStorage<Record<string, string>>(USERS_KEY) ?? {};
    const name = users[clean] ?? clean.split('@')[0];
    this.setUser({ name, email: clean });
  }

  /** Cambia el nombre del usuario actual (lo usará la página de Perfil). */
  updateName(name: string): void {
    const current = this._user();
    if (!current) return;
    this.register(name, current.email);
  }

  logout(): void {
    this.setUser(null);
  }

  private setUser(user: AuthUser | null): void {
    this._user.set(user);
    writeStorage(SESSION_KEY, user);
  }
}

const normalize = (email: string) => email.trim().toLowerCase();
