export type Goal = 'lose_weight' | 'maintain' | 'build_muscle' | 'strength_training' | 'heart_healthy' | 'kidney_transplant_safe';

export type HealthProfile = {
  name: string;
  age?: number;
  heightInches?: number;
  weightLbs?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  primaryGoal: Goal;
  targetCalories?: number;
  proteinGrams?: number;
  sodiumMgLimit?: number;
  mealsPerDay: number;
  avoidFoods: string[];
  medications: string[];
  kidneyTransplant: boolean;
  notes?: string;
};

export type Nutrition = {
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  sodiumMg?: number;
};

export type Ingredient = {
  id: string;
  name: string;
  amount: number;
  unit: string;
  notes?: string;
  normalizedName?: string;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  servings: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  nutritionPerServing: Nutrition;
  safetyFlags: string[];
  createdAt: string;
  updatedAt: string;
  source?: 'generated' | 'imported' | 'manual';
};

export type MealPlanDay = {
  dateLabel: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string[];
  notes?: string;
};

export type MealPlan = {
  id: string;
  title: string;
  goal: Goal;
  days: MealPlanDay[];
  recipeIds: string[];
  estimatedDailyNutrition?: Nutrition;
  coachNotes: string[];
  createdAt: string;
  updatedAt: string;
};

export type GroceryItem = {
  normalizedName: string;
  displayName: string;
  amount: number;
  unit: string;
  category: string;
  recipeTitles: string[];
  notes?: string;
};
