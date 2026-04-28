import { NextResponse } from 'next/server';
import { listUsers, createUser } from '@/app/lib/store';
import { defaultProfile } from '@/app/lib/defaults';
import { Goal } from '@/app/lib/types';

export async function GET() {
  const users = await listUsers();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    const { id, name, primaryGoal } = await req.json();
    if (!id || !name) return NextResponse.json({ error: 'id and name are required' }, { status: 400 });
    const userData = await createUser(id, {
      ...defaultProfile,
      name,
      primaryGoal: (primaryGoal as Goal) || 'lose_weight'
    });
    return NextResponse.json({ id, name: userData.profile.name });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create user' }, { status: 400 });
  }
}
