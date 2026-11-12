import { Injectable, signal } from '@angular/core';
import { Recipe, RecipeCategoryFilter } from '../models/recipe.models';

/** Recetas de prueba (kcal y macros por porción). */
const RECIPES: Recipe[] = [
  {
    id: 1,
    name: 'Pancakes de avena y banano',
    description: 'Pancakes esponjosos sin harina blanca, endulzados solo con banano.',
    emoji: '🥞',
    colorClass: 'bg-orange-soft',
    category: 'desayuno',
    kcal: 350,
    minutes: 20,
    servings: 2,
    macros: { protein: 14, carbs: 56, fat: 8 },
    tags: ['Alta en fibra'],
    ingredients: ['1 taza de avena en hojuelas', '2 bananos maduros', '2 huevos', '1/2 cdta de canela', '1 cdta de polvo de hornear'],
    steps: [
      'Licúa la avena hasta que quede como harina.',
      'Agrega los bananos, los huevos, la canela y el polvo de hornear, y licúa de nuevo.',
      'Calienta un sartén antiadherente a fuego medio.',
      'Vierte porciones de mezcla y cocina 2 minutos por lado.',
    ],
  },
  {
    id: 2,
    name: 'Bowl de yogur griego y frutos rojos',
    description: 'Desayuno fresco y rápido, cargado de proteína.',
    emoji: '🍓',
    colorClass: 'bg-blue-soft',
    category: 'desayuno',
    kcal: 280,
    minutes: 5,
    servings: 1,
    macros: { protein: 20, carbs: 32, fat: 8 },
    tags: ['Alta en proteína', 'Rápida'],
    ingredients: ['170 g de yogur griego natural', '1/2 taza de fresas y arándanos', '2 cdas de granola', '1 cdta de miel'],
    steps: [
      'Sirve el yogur en un tazón.',
      'Corta las fresas y ponlas encima junto con los arándanos.',
      'Termina con la granola y un hilo de miel.',
    ],
  },
  {
    id: 3,
    name: 'Ensalada de quinoa y aguacate',
    description: 'Ensalada completa con quinoa, aguacate y vegetales frescos.',
    emoji: '🥗',
    colorClass: 'bg-lime-soft',
    category: 'almuerzo',
    kcal: 420,
    minutes: 15,
    servings: 2,
    macros: { protein: 12, carbs: 48, fat: 20 },
    tags: ['Vegana'],
    ingredients: ['1 taza de quinoa cocida', '1 aguacate', '1 tomate', '1/2 pepino', 'Jugo de 1 limón', '1 cda de aceite de oliva'],
    steps: [
      'Corta el aguacate, el tomate y el pepino en cubos.',
      'Mezcla los vegetales con la quinoa en un tazón grande.',
      'Aliña con el limón, el aceite de oliva, sal y pimienta.',
    ],
  },
  {
    id: 4,
    name: 'Wrap de pollo y verduras',
    description: 'Tortilla integral rellena de pollo a la plancha y vegetales.',
    emoji: '🌯',
    colorClass: 'bg-orange-soft',
    category: 'almuerzo',
    kcal: 460,
    minutes: 20,
    servings: 1,
    macros: { protein: 36, carbs: 42, fat: 16 },
    tags: ['Alta en proteína'],
    ingredients: ['1 tortilla integral grande', '120 g de pechuga de pollo', '1/2 pimentón', 'Hojas de lechuga', '1 cda de yogur griego'],
    steps: [
      'Cocina el pollo a la plancha con sal y pimienta, y córtalo en tiras.',
      'Saltea el pimentón en tiras por 3 minutos.',
      'Unta la tortilla con el yogur y agrega la lechuga, el pollo y el pimentón.',
      'Enrolla bien y corta por la mitad.',
    ],
  },
  {
    id: 5,
    name: 'Salmón al horno con verduras',
    description: 'Salmón jugoso con brócoli y zanahoria, todo en la misma bandeja.',
    emoji: '🐟',
    colorClass: 'bg-blue-soft',
    category: 'cena',
    kcal: 510,
    minutes: 30,
    servings: 2,
    macros: { protein: 38, carbs: 22, fat: 30 },
    tags: ['Alta en proteína', 'Sin gluten'],
    ingredients: ['2 filetes de salmón (150 g c/u)', '1 brócoli en arbolitos', '2 zanahorias', '1 cda de aceite de oliva', '1 limón'],
    steps: [
      'Precalienta el horno a 200 °C.',
      'Pon el brócoli y la zanahoria en rodajas en una bandeja con aceite y sal.',
      'Coloca el salmón encima con rodajas de limón.',
      'Hornea 18–20 minutos.',
    ],
  },
  {
    id: 6,
    name: 'Crema de ahuyama',
    description: 'Crema suave y reconfortante, ideal para una cena ligera.',
    emoji: '🎃',
    colorClass: 'bg-orange-soft',
    category: 'cena',
    kcal: 220,
    minutes: 35,
    servings: 4,
    macros: { protein: 5, carbs: 30, fat: 9 },
    tags: ['Vegetariana', 'Ligera'],
    ingredients: ['800 g de ahuyama', '1 cebolla', '1 diente de ajo', '3 tazas de caldo de verduras', '2 cdas de crema de leche'],
    steps: [
      'Sofríe la cebolla y el ajo picados.',
      'Agrega la ahuyama en cubos y el caldo, y cocina 20 minutos.',
      'Licúa hasta que quede suave.',
      'Sirve con un hilo de crema de leche.',
    ],
  },
  {
    id: 7,
    name: 'Hummus con bastones de zanahoria',
    description: 'Snack cremoso de garbanzo para comer entre comidas.',
    emoji: '🥕',
    colorClass: 'bg-orange-soft',
    category: 'snacks',
    kcal: 190,
    minutes: 10,
    servings: 2,
    macros: { protein: 7, carbs: 22, fat: 8 },
    tags: ['Vegana'],
    ingredients: ['1 taza de garbanzos cocidos', '1 cda de tahini', 'Jugo de 1/2 limón', '1 diente de ajo', '2 zanahorias'],
    steps: [
      'Licúa los garbanzos con el tahini, el limón, el ajo y un poco de agua.',
      'Corta las zanahorias en bastones.',
      'Sirve el hummus con los bastones para untar.',
    ],
  },
  {
    id: 8,
    name: 'Batido verde de espinaca y mango',
    description: 'Batido refrescante con fruta y un toque de verde.',
    emoji: '🥤',
    colorClass: 'bg-lime-soft',
    category: 'snacks',
    kcal: 160,
    minutes: 5,
    servings: 1,
    macros: { protein: 4, carbs: 32, fat: 2 },
    tags: ['Vegana', 'Rápida'],
    ingredients: ['1 taza de espinaca', '1/2 mango', '1/2 banano', '1 taza de agua o bebida de almendras'],
    steps: ['Pon todos los ingredientes en la licuadora.', 'Licúa hasta que quede suave y sirve frío.'],
  },
];

/**
 * Catálogo de recetas en memoria con signals.
 * No hay backend: los datos son de prueba.
 */
@Injectable({ providedIn: 'root' })
export class RecipeService {
  /** Todas las recetas (solo lectura para los componentes). */
  readonly recipes = signal<Recipe[]>(RECIPES).asReadonly();

  /** Busca una receta por id; devuelve undefined si no existe. */
  getById(id: number): Recipe | undefined {
    return this.recipes().find((r) => r.id === id);
  }

  /**
   * Filtra por categoría ('todas' = sin filtro) y por texto en el nombre o las etiquetas.
   * No distingue mayúsculas ni tildes: "salmon" encuentra "Salmón".
   */
  filter(query: string, category: RecipeCategoryFilter): Recipe[] {
    const text = normalize(query.trim());
    return this.recipes().filter(
      (r) =>
        (category === 'todas' || r.category === category) &&
        (!text || [r.name, ...r.tags].some((value) => normalize(value).includes(text))),
    );
  }
}

/** Pasa a minúsculas y quita tildes: "Salmón" → "salmon". */
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
