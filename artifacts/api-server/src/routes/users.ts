import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "soc_triage_secret_key_2026_change_in_production";

const verifyAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    const [user] = await db
      .select({ role: usersTable.role, isActive: usersTable.isActive })
      .from(usersTable)
      .where(eq(usersTable.id, decoded.id))
      .limit(1);
    if (!user || !user.isActive || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

router.get("/", verifyAdmin, async (req, res) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        role: usersTable.role,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(usersTable.createdAt);
    res.json(users);
  } catch (error) {
    logger.error({ error }, "List users error");
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", verifyAdmin, async (req, res) => {
  const { username, email, password, role, is_active } = req.body as {
    username?: string;
    email?: string;
    password?: string;
    role?: string;
    is_active?: boolean;
  };
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  if (!/^[\w@.\-]+$/.test(username) || username.length > 50) {
    return res.status(400).json({ error: "Invalid username format" });
  }

  const validRoles = ["admin", "analyst", "viewer"];
  const safeRole = validRoles.includes(role ?? "") ? role! : "analyst";

  try {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(or(eq(usersTable.username, username), eq(usersTable.email, email)))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.insert(usersTable).values({
      username,
      email,
      passwordHash,
      role: safeRole,
      isActive: is_active !== false,
    });
    res.status(201).json({ success: true, message: "User created successfully" });
  } catch (error) {
    logger.error({ error }, "Create user error");
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const { username, email, role, is_active } = req.body as {
    username?: string;
    email?: string;
    role?: string;
    is_active?: boolean;
  };

  if (!username || !email) {
    return res.status(400).json({ error: "Username and email required" });
  }

  const validRoles = ["admin", "analyst", "viewer"];
  const safeRole = validRoles.includes(role ?? "") ? role! : "analyst";

  try {
    await db
      .update(usersTable)
      .set({
        username,
        email,
        role: safeRole,
        isActive: is_active !== false,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, id));
    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    logger.error({ error }, "Update user error");
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", verifyAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const requestingUserId = req.userId as number;
  if (id === requestingUserId) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  try {
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    logger.error({ error }, "Delete user error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
