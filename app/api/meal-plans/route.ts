import { NextResponse } from 'next/server';
import { readUserDb, writeUserDb, makeId } from '@/app/lib/store';
import { MealPlan } from '@/app/lib/types';

function uid(req: Request) { return new URL(req.url).searchParams.get('user') || 'default'; }

export async function GET(req: Request) {
  const db = await readUserDb(uid(req));
  return NextResponse.json(db.mealPlans.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
}

export async function POST(req: Request) {
  const userId = uid(req);
  const db = await readUserDb(userId);
  const now = new Date().toISOString();
  const input = await req.json();
  const plan: MealPlan = { ...input, id: input.id || makeId('plan'), createdAt: input.createdAt || now, updatedAt: now };
  db.mealPlans.unshift(plan);
  await writeUserDb(userId, db);
  return NextResponse.json(plan);
}
