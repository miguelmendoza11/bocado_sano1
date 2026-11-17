import { readStorage, writeStorage } from './storage';

describe('storage helpers', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('saves and reads back a JSON value', () => {
    writeStorage('prueba', { a: 1, lista: [1, 2] });
    expect(readStorage('prueba')).toEqual({ a: 1, lista: [1, 2] });
  });

  it('returns null when the key does not exist', () => {
    expect(readStorage('no-existe')).toBeNull();
  });

  it('returns null when the saved data is broken', () => {
    localStorage.setItem('roto', '{esto no es json');
    expect(readStorage('roto')).toBeNull();
  });

  it('removes the key when the value is null', () => {
    writeStorage('prueba', 1);
    writeStorage('prueba', null);
    expect(localStorage.getItem('prueba')).toBeNull();
  });

  it('does not throw when localStorage fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => writeStorage('prueba', 1)).not.toThrow();
    expect(readStorage('prueba')).toBeNull();
  });
});
