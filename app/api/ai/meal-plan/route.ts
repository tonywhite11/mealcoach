import { NextResponse } from 'next/server';
import { generateMealPlanAI } from '@/app/lib/ai';
import { readUserDb } from '@/app/lib/store';

export async function POST(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get('user') || 'default';
    const db = await readUserDb(userId);
    const { days, goal, preferences } = await req.json();
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Missing OPENAI_API_KEY in .env.local' }, { status: 400 });
    const plan = await generateMealPlanAI({ days: Number(days || 7), goal, preferences, profile: db.profile, recipeTitles: db.recipes.map(r => r.title) });
    return NextResponse.json(plan);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Meal plan generation failed' }, { status: 500 });
  }
}
