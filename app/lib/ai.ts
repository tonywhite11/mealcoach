import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { HealthProfile } from './types';

const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const ingredientSchema = z.object({
  name: z.string(),
  amount: z.number().positive(),
  unit: z.string(),
  notes: z.string().nullable()
});

export const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  servings: z.number().int().positive(),
  prepTimeMinutes: z.number().int().nullable(),
  cookTimeMinutes: z.number().int().nullable(),
  tags: z.array(z.string()),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(z.string()),
  nutritionPerServing: z.object({
    calories: z.number().nullable(),
    proteinG: z.number().nullable(),
    carbsG: z.number().nullable(),
    fatG: z.number().nullable(),
    fiberG: z.number().nullable(),
    sodiumMg: z.number().nullable()
  }),
  safetyFlags: z.array(z.string())
});

export const mealPlanSchema = z.object({
  title: z.string(),
  goal: z.enum(['lose_weight', 'maintain', 'build_muscle', 'strength_training', 'heart_healthy', 'kidney_transplant_safe']),
  days: z.array(z.object({
    dateLabel: z.string(),
    breakfast: z.string().nullable(),
    lunch: z.string().nullable(),
    dinner: z.string().nullable(),
    snacks: z.array(z.string()).nullable(),
    notes: z.string().nullable()
  })),
  recipeTitles: z.array(z.string()),
  estimatedDailyNutrition: z.object({
    calories: z.number().nullable(),
    proteinG: z.number().nullable(),
    carbsG: z.number().nullable(),
    fatG: z.number().nullable(),
    fiberG: z.number().nullable(),
    sodiumMg: z.number().nullable()
  }).nullable(),
  coachNotes: z.array(z.string())
});

function profileText(profile: HealthProfile) {
  return JSON.stringify(profile, null, 2);
}

export async function generateRecipeAI(input: {
  mealName: string;
  preferences?: string;
  servings: number;
  profile: HealthProfile;
}) {
  const { object } = await generateObject({
    model: openai(modelName),
    schema: recipeSchema,
    prompt: `Create a practical recipe for a personal meal planning app.\n\nMeal request: ${input.mealName}\nServings: ${input.servings}\nPreferences: ${input.preferences || 'none'}\nUser health profile:\n${profileText(input.profile)}\n\nRules:\n- Return realistic ingredient amounts and cooking instructions.\n- Make nutrition estimates per serving.\n- Favor high protein, reasonable calories, and simple grocery ingredients unless the user asks otherwise.\n- If kidneyTransplant is true or medications include tacrolimus, flag grapefruit/pomelo/Seville orange and raw/undercooked food risks.\n- Do not include grapefruit or grapefruit juice.\n- Avoid pretending to provide medical treatment. Include safetyFlags where appropriate.`
  });
  return object;
}

export async function importRecipeAI(input: { rawText?: string; imageDataUrl?: string; profile: HealthProfile }) {
  const userText = `Extract and clean this recipe. If it is messy OCR/screenshot/photo text, infer the likely structure without inventing unnecessary ingredients.\n\nRaw input text, if any:\n${input.rawText || 'none'}\n\nUser profile:\n${profileText(input.profile)}\n\nReturn a structured recipe with servings, ingredients, instructions, nutrition estimate, tags, and safety flags. If the source contains grapefruit or unsafe raw ingredients, flag it and suggest safer alternatives in safetyFlags.`;

  const { object } = await generateObject({
    model: openai(modelName),
    schema: recipeSchema,
    messages: [{
      role: 'user',
      content: input.imageDataUrl
        ? [{ type: 'text', text: userText }, { type: 'image', image: input.imageDataUrl }]
        : [{ type: 'text', text: userText }]
    }]
  });
  return object;
}

export async function generateMealPlanAI(input: {
  days: number;
  goal: string;
  preferences?: string;
  profile: HealthProfile;
  recipeTitles: string[];
}) {
  const { object } = await generateObject({
    model: openai(modelName),
    schema: mealPlanSchema,
    prompt: `Create a ${input.days}-day meal plan.\nGoal: ${input.goal}\nPreferences: ${input.preferences || 'none'}\nExisting saved recipes available: ${input.recipeTitles.join(', ') || 'none'}\nUser profile:\n${profileText(input.profile)}\n\nRules:\n- Use existing recipes when useful, but you can suggest new recipe titles too.\n- Keep the plan realistic for a person cooking at home.\n- Include coach notes that are direct, practical, and portion-focused.\n- Respect kidney transplant safety and tacrolimus grapefruit avoidance if present.\n- Mention calorie/protein targets as estimates, not medical orders.`
  });
  return object;
}
