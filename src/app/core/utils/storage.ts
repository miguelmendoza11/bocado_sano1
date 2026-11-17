/**
 * Ayudas para usar localStorage sin que la app se rompa.
 * localStorage puede fallar (modo privado, almacenamiento lleno, dato corrupto...):
 * en ese caso se lee null y la escritura simplemente no se guarda.
 *
 * Todas las claves de la app empiezan con este prefijo.
 */
export const STORAGE_PREFIX = 'bocado-sano.';

/** Lee un JSON guardado. Si no existe o falla, devuelve null. */
export function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Guarda un valor como JSON (o lo borra si value es null). */
export function writeStorage(key: string, value: unknown): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Sin localStorage los datos solo duran hasta recargar la página.
  }
}
