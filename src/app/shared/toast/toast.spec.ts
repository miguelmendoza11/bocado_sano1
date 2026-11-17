import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../../core/services/toast.service';
import { Toasts } from './toast';

describe('Toasts', () => {
  let fixture: ComponentFixture<Toasts>;
  let el: HTMLElement;
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Toasts] }).compileComponents();
    fixture = TestBed.createComponent(Toasts);
    el = fixture.nativeElement;
    service = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  const toasts = () => [...el.querySelectorAll<HTMLElement>('.sano-toast')];

  async function render() {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('has a polite live region and starts empty', () => {
    expect(el.querySelector('.toast-stack')?.getAttribute('aria-live')).toBe('polite');
    expect(toasts()).toHaveLength(0);
  });

  it('shows the message with an icon and role for each type', async () => {
    service.success('Guardado');
    service.info('Sesión cerrada');
    service.error('Algo falló');
    await render();

    const [ok, info, error] = toasts();
    expect(ok.textContent).toContain('Guardado');
    expect(ok.querySelector('.bi-check-circle-fill')).not.toBeNull();
    expect(ok.getAttribute('role')).toBe('status');
    expect(info.querySelector('.bi-info-circle-fill')).not.toBeNull();
    expect(error.querySelector('.bi-exclamation-circle-fill')).not.toBeNull();
    expect(error.getAttribute('role')).toBe('alert');
  });

  it('closes a toast with the X button', async () => {
    service.success('Hola');
    await render();

    toasts()[0].querySelector<HTMLButtonElement>('[aria-label="Cerrar aviso"]')!.click();
    await render();
    expect(service.toasts()).toHaveLength(0);
  });

  it('shows the action button only when there is an action, and runs it', async () => {
    const run = vi.fn();
    service.success('Sin acción');
    service.success('Agregado', { action: { label: 'Deshacer', run } });
    await render();

    const [plain, withAction] = toasts();
    expect(plain.querySelector('.toast-action')).toBeNull();
    const button = withAction.querySelector<HTMLButtonElement>('.toast-action')!;
    expect(button.textContent?.trim()).toBe('Deshacer');

    button.click();
    await render();
    expect(run).toHaveBeenCalledOnce();
    expect(service.toasts().map((t) => t.message)).toEqual(['Sin acción']);
  });
});
