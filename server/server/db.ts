import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userPlans } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserStripeInfo(userId: number, data: {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
  isProSubscriber?: boolean;
  proActivatedAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update stripe info: database not available");
    return;
  }
  await db.update(users).set(data).where(eq(users.id, userId));
}

// TODO: add feature queries here as your schema grows.

/**
 * Upsert the user's full financial plan (local-first cloud sync).
 * clientUpdatedAt is the ms-since-epoch timestamp from the client's last local change.
 * We only overwrite the server copy if the incoming clientUpdatedAt is newer.
 */
export async function savePlan(userId: number, planData: string, clientUpdatedAt: number): Promise<{ saved: boolean; serverClientUpdatedAt: number | null }> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save plan: database not available");
    return { saved: false, serverClientUpdatedAt: null };
  }

  // Check existing record
  const existing = await db.select().from(userPlans).where(eq(userPlans.userId, userId)).limit(1);
  if (existing.length > 0 && existing[0].clientUpdatedAt > clientUpdatedAt) {
    // Server has a newer version — don't overwrite, let client know
    return { saved: false, serverClientUpdatedAt: existing[0].clientUpdatedAt };
  }

  await db.insert(userPlans)
    .values({ userId, planData, clientUpdatedAt })
    .onDuplicateKeyUpdate({ set: { planData, clientUpdatedAt } });

  return { saved: true, serverClientUpdatedAt: clientUpdatedAt };
}

/**
 * Load the user's saved plan from the database.
 * Returns null if no plan exists yet.
 */
export async function loadPlan(userId: number): Promise<{ planData: string; clientUpdatedAt: number } | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot load plan: database not available");
    return null;
  }

  const result = await db.select().from(userPlans).where(eq(userPlans.userId, userId)).limit(1);
  if (result.length === 0) return null;
  return { planData: result[0].planData, clientUpdatedAt: result[0].clientUpdatedAt };
}
