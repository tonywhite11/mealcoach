import { GroceryItem, Ingredient, Recipe } from './types';

const aliases: Record<string, string> = {
  scallions: 'green onion',
  'green onions': 'green onion',
  'yellow onion': 'onion',
  onions: 'onion',
  'garlic cloves': 'garlic',
  cloves: 'garlic',
  'extra virgin olive oil': 'olive oil',
  evoo: 'olive oil',
  'boneless skinless chicken breast': 'chicken breast',
  'chicken breasts': 'chicken breast',
  'ground turkey meat': 'ground turkey'
};

const unitMap: Record<string, string> = {
  tsp: 'teaspoon',
  teaspoons: 'teaspoon',
  tbsp: 'tablespoon',
  tablespoons: 'tablespoon',
  cups: 'cup',
  ounces: 'ounce',
  oz: 'ounce',
  lbs: 'pound',
  lb: 'pound',
  grams: 'gram',
  g: 'gram',
  kg: 'kilogram',
  cloves: 'clove',
  cans: 'can'
};

const categoryRules: Array<[RegExp, string]> = [
  [/(lettuce|spinach|kale|onion|garlic|pepper|tomato|avocado|broccoli|carrot|celery|potato|banana|apple|berry|lime|lemon)/i, 'Produce'],
  [/(chicken|turkey|beef|pork|salmon|tuna|shrimp|fish|steak)/i, 'Meat & Seafood'],
  [/(egg|milk|cheese|yogurt|butter|cream)/i, 'Dairy & Eggs'],
  [/(rice|oat|flour|bean|lentil|pasta|quinoa|oil|vinegar|broth|canned|can|tortilla)/i, 'Pantry'],
  [/(frozen)/i, 'Frozen'],
  [/(salt|pepper|paprika|cumin|oregano|basil|thyme|chili|cinnamon|seasoning)/i, 'Spices'],
  [/(sauce|mustard|mayo|ketchup|salsa|dressing)/i, 'Condiments']
];

function normalizeName(name: string): string {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, ' ');
  return aliases[cleaned] || cleaned.replace(/s$/, '');
}

function normalizeUnit(unit: string): string {
  const cleaned = unit.toLowerCase().trim();
  return unitMap[cleaned] || cleaned || 'item';
}

function convert(amount: number, unit: string): { amount: number; unit: string } {
  const u = normalizeUnit(unit);
  if (u === 'teaspoon' && amount >= 3) return { amount: amount / 3, unit: 'tablespoon' };
  if (u === 'ounce' && amount >= 16) return { amount: amount / 16, unit: 'pound' };
  if (u === 'gram' && amount >= 1000) return { amount: amount / 1000, unit: 'kilogram' };
  return { amount, unit: u };
}

function categoryFor(name: string): string {
  return categoryRules.find(([regex]) => regex.test(name))?.[1] || 'Other';
}

export function aggregateGroceries(recipes: Recipe[]): GroceryItem[] {
  const map = new Map<string, GroceryItem>();
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const normalizedName = ingredient.normalizedName || normalizeName(ingredient.name);
      const converted = convert(Number(ingredient.amount || 1), ingredient.unit || 'item');
      const key = `${normalizedName}|${converted.unit}`;
      const existing = map.get(key);
      if (existing) {
        existing.amount += converted.amount;
        if (!existing.recipeTitles.includes(recipe.title)) existing.recipeTitles.push(recipe.title);
      } else {
        map.set(key, {
          normalizedName,
          displayName: normalizedName.replace(/\b\w/g, l => l.toUpperCase()),
          amount: converted.amount,
          unit: converted.unit,
          category: categoryFor(normalizedName),
          recipeTitles: [recipe.title],
          notes: ingredient.notes
        });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category) || a.displayName.localeCompare(b.displayName));
}

export function ingredientFromText(name: string, amount = 1, unit = 'item'): Ingredient {
  return {
    id: crypto.randomUUID(),
    name,
    amount,
    unit,
    normalizedName: normalizeName(name)
  };
}
