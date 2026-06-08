import { Router } from "express";
import crypto from "crypto";
import { db, usersTable, sessionsTable } from "../lib/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const router = Router();

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const ITERATIONS = 100_000;
const DIGEST = "sha512";
const COOKIE_NAME = "vgc_session";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
}

export async function getSession(token: string) {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  if (!session) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  return user ?? null;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    (req as any).user = null;
    next();
    return;
  }
  getSession(token).then(user => {
    (req as any).user = user;
    next();
  }).catch(() => {
    (req as any).user = null;
    next();
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!(req as any).user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const normalizedEmail = (email as string).toLowerCase().trim();

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({ email: normalizedEmail, passwordHash }).returning();

    const token = crypto.randomUUID();
    await db.insert(sessionsTable).values({ token, userId: user.id });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const normalizedEmail = (email as string).toLowerCase().trim();
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = crypto.randomUUID();
    await db.insert(sessionsTable).values({ token, userId: user.id });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
      await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
    }
    res.clearCookie(COOKIE_NAME);
    res.json({ ok: true });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
});

router.get("/auth/me", async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
