import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'error';

/** Botón opcional dentro del aviso ("Deshacer", "Ver diario"...). */
export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

export interface ToastOptions {
  type?: ToastType;
  action?: ToastAction;
  /** Milisegundos antes de cerrarse solo. Por defecto 3,5 s (5 s si tiene acción). */
  duration?: number;
}

/** Máximo de avisos visibles a la vez: si llega otro, se va el más viejo. */
const MAX_TOASTS = 3;
const DURATION_MS = 3500;
const DURATION_WITH_ACTION_MS = 5000;

/**
 * Avisos flotantes para toda la app.
 * Las páginas llaman a success()/info()/error() y el componente <app-toasts /> los dibuja.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 1;
  /** Un temporizador por aviso, para poder cancelarlo al cerrarlo antes de tiempo. */
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  show(message: string, options: ToastOptions = {}): number {
    const toast: Toast = {
      id: this.nextId++,
      message,
      type: options.type ?? 'success',
      action: options.action,
    };

    // Si ya hay 3, se cierra el más viejo antes de agregar el nuevo
    const current = this._toasts();
    if (current.length >= MAX_TOASTS) {
      this.dismiss(current[0].id);
    }
    this._toasts.update((list) => [...list, toast]);

    const duration = options.duration ?? (toast.action ? DURATION_WITH_ACTION_MS : DURATION_MS);
    this.timers.set(
      toast.id,
      setTimeout(() => this.dismiss(toast.id), duration),
    );
    return toast.id;
  }

  success(message: string, options: Omit<ToastOptions, 'type'> = {}): number {
    return this.show(message, { ...options, type: 'success' });
  }

  info(message: string, options: Omit<ToastOptions, 'type'> = {}): number {
    return this.show(message, { ...options, type: 'info' });
  }

  error(message: string, options: Omit<ToastOptions, 'type'> = {}): number {
    return this.show(message, { ...options, type: 'error' });
  }

  /** Cierra un aviso y limpia su temporizador. */
  dismiss(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  /** Ejecuta la acción del aviso y lo cierra. */
  runAction(toast: Toast): void {
    toast.action?.run();
    this.dismiss(toast.id);
  }
}
