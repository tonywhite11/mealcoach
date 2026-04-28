import { HealthProfile, MealPlan, Recipe } from './types';
import { defaultProfile } from './defaults';

export type UserData = {
  profile: HealthProfile;
  recipes: Recipe[];
  mealPlans: MealPlan[];
};

type DB = {
  users: Record<string, UserData>;
};

const useKV = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// ---------- Upstash Redis helpers ----------
function getRedis() {
  const { Redis } = require('@upstash/redis');
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!
  });
}

async function kvGetDb(): Promise<DB> {
  const db = await getRedis().get<DB>('mealcoach_db');
  return db ?? { users: { default: { profile: defaultProfile, recipes: [], mealPlans: [] } } };
}

async function kvSetDb(db: DB): Promise<void> {
  await getRedis().set('mealcoach_db', db);
}

// ---------- Local file helpers ----------
import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'mealcoach.json');

async function fileGetDb(): Promise<DB> {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const raw = await fs.readFile(dbPath, 'utf-8');
    const parsed = JSON.parse(raw);
    // migrate from old single-user flat format
    if (!parsed.users) {
      const migrated: DB = {
        users: {
          default: {
            profile: parsed.profile || defaultProfile,
            recipes: parsed.recipes || [],
            mealPlans: parsed.mealPlans || []
          }
        }
      };
      await fs.writeFile(dbPath, JSON.stringify(migrated, null, 2), 'utf-8');
      return migrated;
    }
    return parsed as DB;
  } catch {
    return { users: { default: { profile: defaultProfile, recipes: [], mealPlans: [] } } };
  }
}

async function fileSetDb(db: DB): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}

// ---------- Public API ----------
async function getDb(): Promise<DB> {
  return useKV ? kvGetDb() : fileGetDb();
}

async function setDb(db: DB): Promise<void> {
  return useKV ? kvSetDb(db) : fileSetDb(db);
}

export async function readUserDb(userId = 'default'): Promise<UserData> {
  const db = await getDb();
  return db.users[userId] || { profile: defaultProfile, recipes: [], mealPlans: [] };
}

export async function writeUserDb(userId = 'default', data: UserData): Promise<UserData> {
  const db = await getDb();
  db.users[userId] = data;
  await setDb(db);
  return data;
}

export async function listUsers(): Promise<Array<{ id: string; name: string }>> {
  const db = await getDb();
  return Object.entries(db.users).map(([id, data]) => ({ id, name: data.profile.name || id }));
}

export async function createUser(id: string, profile: HealthProfile): Promise<UserData> {
  const db = await getDb();
  if (db.users[id]) throw new Error(`User "${id}" already exists`);
  const userData: UserData = { profile, recipes: [], mealPlans: [] };
  db.users[id] = userData;
  await setDb(db);
  return userData;
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
