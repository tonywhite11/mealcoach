import { NextResponse } from 'next/server';
import { readUserDb } from '@/app/lib/store';
import { aggregateGroceries } from '@/app/lib/grocery';

export async function POST(req: Request) {
  const userId = new URL(req.url).searchParams.get('user') || 'default';
  const db = await readUserDb(userId);
  const { recipeIds } = await req.json();
  const selected = recipeIds?.length ? db.recipes.filter(r => recipeIds.includes(r.id)) : db.recipes;
  return NextResponse.json(aggregateGroceries(selected));
}
