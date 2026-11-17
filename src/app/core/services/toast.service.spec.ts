import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => vi.useRealTimers());

  const messages = () => service.toasts().map((t) => t.message);

  it('adds a toast with its type', () => {
    service.success('Guardado');
    service.info('Sesión cerrada');
    service.error('Algo falló');
    expect(service.toasts().map((t) => t.type)).toEqual(['success', 'info', 'error']);
    expect(messages()).toEqual(['Guardado', 'Sesión cerrada', 'Algo falló']);
  });

  it('closes by itself after 3.5 s', () => {
    service.success('Hola');
    vi.advanceTimersByTime(3400);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(100);
    expect(service.toasts()).toHaveLength(0);
  });

  it('waits 5 s when it has an action', () => {
    service.success('Agregado', { action: { label: 'Deshacer', run: () => {} } });
    vi.advanceTimersByTime(4900);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(100);
    expect(service.toasts()).toHaveLength(0);
  });

  it('keeps at most 3 toasts, removing the oldest', () => {
    ['1', '2', '3', '4'].forEach((m) => service.info(m));
    expect(messages()).toEqual(['2', '3', '4']);
  });

  it('dismisses a toast and clears its timer', () => {
    const id = service.success('Hola');
    service.success('Otro');
    service.dismiss(id);
    expect(messages()).toEqual(['Otro']);
    expect(vi.getTimerCount()).toBe(1); // solo queda el temporizador de "Otro"
  });

  it('runs the action and closes the toast', () => {
    const run = vi.fn();
    service.success('Agregado', { action: { label: 'Deshacer', run } });
    service.runAction(service.toasts()[0]);
    expect(run).toHaveBeenCalledOnce();
    expect(service.toasts()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
