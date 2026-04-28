import { NextResponse } from 'next/server';
import { generateRecipeAI } from '@/app/lib/ai';
import { readUserDb } from '@/app/lib/store';

export async function POST(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get('user') || 'default';
    const db = await readUserDb(userId);
    const { mealName, preferences, servings } = await req.json();
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Missing OPENAI_API_KEY in .env.local' }, { status: 400 });
    const recipe = await generateRecipeAI({ mealName, preferences, servings: Number(servings || 4), profile: db.profile });
    return NextResponse.json(recipe);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Recipe generation failed' }, { status: 500 });
  }
}
