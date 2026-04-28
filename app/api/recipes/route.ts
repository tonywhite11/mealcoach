import { NextResponse } from 'next/server';
import { readUserDb, writeUserDb, makeId } from '@/app/lib/store';
import { Recipe } from '@/app/lib/types';

function uid(req: Request) { return new URL(req.url).searchParams.get('user') || 'default'; }

export async function GET(req: Request) {
  const db = await readUserDb(uid(req));
  return NextResponse.json(db.recipes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

export async function POST(req: Request) {
  const userId = uid(req);
  const db = await readUserDb(userId);
  const now = new Date().toISOString();
  const input = await req.json();
  const recipe: Recipe = { ...input, id: input.id || makeId('recipe'), createdAt: input.createdAt || now, updatedAt: now };
  db.recipes.unshift(recipe);
  await writeUserDb(userId, db);
  return NextResponse.json(recipe);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const userId = searchParams.get('user') || 'default';
  const db = await readUserDb(userId);
  db.recipes = db.recipes.filter(r => r.id !== id);
  await writeUserDb(userId, db);
  return NextResponse.json({ ok: true });
}
