import { NextResponse } from 'next/server';
import { importRecipeAI } from '@/app/lib/ai';
import { readUserDb } from '@/app/lib/store';

export async function POST(req: Request) {
  try {
    const userId = new URL(req.url).searchParams.get('user') || 'default';
    const db = await readUserDb(userId);
    const { rawText, imageDataUrl } = await req.json();
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Missing OPENAI_API_KEY in .env.local' }, { status: 400 });
    const recipe = await importRecipeAI({ rawText, imageDataUrl, profile: db.profile });
    return NextResponse.json(recipe);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Recipe import failed' }, { status: 500 });
  }
}
