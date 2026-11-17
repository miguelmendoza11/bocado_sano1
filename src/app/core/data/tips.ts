/** Tema del consejo: define el color del círculo del ícono. */
export type TipCategory = 'agua' | 'comida' | 'movimiento' | 'descanso';

export interface Tip {
  text: string;
  /** Ícono de Bootstrap Icons (bi-*). */
  icon: string;
  category: TipCategory;
}

/**
 * Consejos del día: lista fija escrita por el equipo (no viene de ninguna API).
 * Son consejos generales de hábitos, no reemplazan la opinión de un profesional.
 */
export const TIPS: Tip[] = [
  {
    text: 'Tomar un vaso de agua antes de cada comida ayuda a sentirte lleno antes.',
    icon: 'bi-droplet-fill',
    category: 'agua',
  },
  {
    text: 'Llena la mitad del plato con verduras: más fibra y menos calorías.',
    icon: 'bi-basket2-fill',
    category: 'comida',
  },
  {
    text: 'Una caminata de 10 minutos después de comer ayuda a la digestión.',
    icon: 'bi-person-walking',
    category: 'movimiento',
  },
  {
    text: 'Dormir 7 u 8 horas ayuda a controlar el hambre del día siguiente.',
    icon: 'bi-moon-stars-fill',
    category: 'descanso',
  },
  {
    text: 'Lleva una botella de agua contigo: es más fácil tomar sin darte cuenta.',
    icon: 'bi-cup-straw',
    category: 'agua',
  },
  {
    text: 'Come despacio y sin pantallas: tu cuerpo tarda unos 20 minutos en sentirse lleno.',
    icon: 'bi-hourglass-split',
    category: 'comida',
  },
  {
    text: 'Usa las escaleras en vez del ascensor cuando puedas: suma pasos sin esfuerzo.',
    icon: 'bi-bar-chart-steps',
    category: 'movimiento',
  },
  {
    text: 'Apaga las pantallas media hora antes de dormir para descansar mejor.',
    icon: 'bi-phone-vibrate',
    category: 'descanso',
  },
  {
    text: 'Si tienes hambre entre comidas, prueba primero con un vaso de agua.',
    icon: 'bi-droplet-half',
    category: 'agua',
  },
  {
    text: 'Incluye proteína en el desayuno (huevo, yogur, frijoles): te mantiene lleno más tiempo.',
    icon: 'bi-egg-fried',
    category: 'comida',
  },
  {
    text: 'Cada hora sentado, levántate 2 minutos a estirar las piernas.',
    icon: 'bi-stopwatch',
    category: 'movimiento',
  },
  {
    text: 'Acostarte y levantarte a la misma hora ayuda a que tu cuerpo descanse mejor.',
    icon: 'bi-alarm-fill',
    category: 'descanso',
  },
  {
    text: 'Agrega limón, pepino o menta al agua si te cuesta tomarla sola.',
    icon: 'bi-cup-hot-fill',
    category: 'agua',
  },
  {
    text: 'Prefiere la fruta entera al jugo: tiene más fibra y llena más.',
    icon: 'bi-apple',
    category: 'comida',
  },
  {
    text: 'Bailar tu canción favorita también cuenta como ejercicio.',
    icon: 'bi-music-note-beamed',
    category: 'movimiento',
  },
  {
    text: 'Una siesta corta de 20 minutos recarga energía sin quitarte el sueño de la noche.',
    icon: 'bi-battery-charging',
    category: 'descanso',
  },
  {
    text: 'Planea tus comidas de la semana: evitas comprar por antojo.',
    icon: 'bi-calendar-check-fill',
    category: 'comida',
  },
  {
    text: 'Camina mientras hablas por teléfono: sumas pasos sin darte cuenta.',
    icon: 'bi-telephone-fill',
    category: 'movimiento',
  },
  {
    text: 'Sirve en platos más pequeños: la porción se ve generosa y comes lo justo.',
    icon: 'bi-circle-half',
    category: 'comida',
  },
  {
    text: 'Respira profundo 5 veces cuando sientas estrés: también ayuda a no comer por ansiedad.',
    icon: 'bi-wind',
    category: 'descanso',
  },
];

/** Fecha fija desde la que se cuentan los días (1 de enero de 2026). */
const START_DAY = Date.UTC(2026, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Índice del consejo de un día: el mismo durante todo el día y distinto al siguiente.
 * Usa la fecha LOCAL (año, mes y día del computador), no UTC: así el consejo cambia
 * a la medianoche de aquí y no a una hora rara. Date.UTC con esos números evita
 * los saltos del horario de verano.
 */
export function tipIndexFor(date: Date, total: number): number {
  if (total <= 0) return 0;
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((today - START_DAY) / DAY_MS);
  // % puede dar negativo con fechas antes de START_DAY: se ajusta a 0..total-1
  return ((days % total) + total) % total;
}
