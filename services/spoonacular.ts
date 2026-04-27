const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || "";
const BASE_URL = "https://api.spoonacular.com";

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
}

export interface SpoonacularIngredient {
  name: string;
  amount: number;
  unit: string;
  aisle: string;
}

export interface SpoonacularRecipeDetail {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  summary: string;
  extendedIngredients: SpoonacularIngredient[];
}

export async function searchRecipes(
  query: string,
  number: number = 6
): Promise<SpoonacularRecipe[]> {
  const url = `${BASE_URL}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${number}&addRecipeInformation=true&apiKey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    image: r.image,
    readyInMinutes: r.readyInMinutes || 0,
    servings: r.servings || 0,
  }));
}

export async function getRecipeDetails(
  recipeId: number
): Promise<SpoonacularRecipeDetail> {
  const url = `${BASE_URL}/recipes/${recipeId}/information?includeNutrition=false&apiKey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`);
  const data = await res.json();
  return {
    id: data.id,
    title: data.title,
    image: data.image,
    readyInMinutes: data.readyInMinutes || 0,
    servings: data.servings || 0,
    sourceUrl: data.sourceUrl || "",
    summary: data.summary || "",
    extendedIngredients: (data.extendedIngredients || []).map((ing: any) => ({
      name: ing.name || ing.originalName || "",
      amount: ing.amount || 1,
      unit: ing.unit || "",
      aisle: ing.aisle || "",
    })),
  };
}
