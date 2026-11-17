import { firstName, greetingFor, greetingText } from './greeting';

describe('greetingFor', () => {
  it.each([
    [4, 'Buenas noches', 'night'], // 4:59 sigue siendo de noche
    [5, 'Buenos días', 'morning'], // 5:00 empieza la mañana
    [11, 'Buenos días', 'morning'], // 11:59
    [12, 'Buenas tardes', 'afternoon'], // 12:00
    [18, 'Buenas tardes', 'afternoon'], // 18:59
    [19, 'Buenas noches', 'night'], // 19:00
    [23, 'Buenas noches', 'night'],
    [0, 'Buenas noches', 'night'],
  ])('at %i h says "%s" with the %s icon', (hour, text, icon) => {
    expect(greetingFor(hour)).toEqual({ text, icon });
  });

  it('uses the hour of a real Date at the edges', () => {
    // Lo que hace Inicio: greetingFor(now().getHours())
    const at = (h: number, m: number) => greetingFor(new Date(2026, 10, 16, h, m).getHours()).text;
    expect(at(4, 59)).toBe('Buenas noches');
    expect(at(5, 0)).toBe('Buenos días');
    expect(at(11, 59)).toBe('Buenos días');
    expect(at(12, 0)).toBe('Buenas tardes');
    expect(at(18, 59)).toBe('Buenas tardes');
    expect(at(19, 0)).toBe('Buenas noches');
  });
});

describe('firstName', () => {
  it('keeps only the first name', () => {
    expect(firstName('Juan Montezuma')).toBe('Juan');
    expect(firstName('  Ana   María Gómez ')).toBe('Ana');
    expect(firstName('Sebas')).toBe('Sebas');
  });

  it('returns an empty text without a name', () => {
    expect(firstName('')).toBe('');
    expect(firstName('   ')).toBe('');
    expect(firstName(null)).toBe('');
    expect(firstName(undefined)).toBe('');
  });
});

describe('greetingText', () => {
  it('adds the first name after a comma', () => {
    expect(greetingText(8, 'Juan Montezuma')).toBe('Buenos días, Juan');
    expect(greetingText(20, 'Ana')).toBe('Buenas noches, Ana');
  });

  it('is only the greeting when there is no name', () => {
    expect(greetingText(15, '')).toBe('Buenas tardes');
    expect(greetingText(15, null)).toBe('Buenas tardes');
  });
});
