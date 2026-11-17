/** Ícono del saludo según la franja del día. */
export type GreetingIcon = 'morning' | 'afternoon' | 'night';

export interface Greeting {
  text: string;
  icon: GreetingIcon;
}

/**
 * Saludo según la hora (0–23), con la hora del computador:
 *  5:00–11:59 → "Buenos días"
 * 12:00–18:59 → "Buenas tardes"
 * 19:00–4:59  → "Buenas noches"
 */
export function greetingFor(hour: number): Greeting {
  if (hour >= 5 && hour < 12) return { text: 'Buenos días', icon: 'morning' };
  if (hour >= 12 && hour < 19) return { text: 'Buenas tardes', icon: 'afternoon' };
  return { text: 'Buenas noches', icon: 'night' };
}

/** Primer nombre: "  Juan Montezuma " → "Juan". Vacío si no hay nombre. */
export function firstName(fullName: string | null | undefined): string {
  return fullName?.trim().split(/\s+/)[0] ?? '';
}

/** "Buenos días, Juan" o solo "Buenos días" si no hay nombre. */
export function greetingText(hour: number, fullName: string | null | undefined): string {
  const { text } = greetingFor(hour);
  const name = firstName(fullName);
  return name ? `${text}, ${name}` : text;
}
