import { NextResponse } from 'next/server';
import { readUserDb, writeUserDb } from '@/app/lib/store';

function uid(req: Request) { return new URL(req.url).searchParams.get('user') || 'default'; }

export async function GET(req: Request) {
  const db = await readUserDb(uid(req));
  return NextResponse.json(db.profile);
}

export async function PUT(req: Request) {
  const userId = uid(req);
  const db = await readUserDb(userId);
  const profile = await req.json();
  db.profile = { ...db.profile, ...profile };
  await writeUserDb(userId, db);
  return NextResponse.json(db.profile);
}
