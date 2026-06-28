import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { logger } from "../lib/logger.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.warn("JWT_SECRET not set — using insecure default. Set JWT_SECRET in production!");
}
const SECRET = JWT_SECRET || "soc_triage_secret_key_2026_change_in_production";

router.post("/login", authLimiter, async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  // Sanitize username to prevent injection
  if (typeof username !== "string" || username.length > 50 || !/^[\w@.\-]+$/.test(username)) {
    res.status(400).json({ error: "Invalid username format" });
    return;
  }

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        passwordHash: usersTable.passwordHash,
        role: usersTable.role,
        isActive: usersTable.isActive,
      })
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!user || !user.isActive) {
      // Constant-time response to prevent user enumeration
      await bcrypt.compare(password, "$2a$10$invalidhashfortimingatk");
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET,
      { expiresIn: "24h" }
    );
    logger.info({ userId: user.id, username: user.username }, "User logged in");
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    logger.error({ error }, "Login error");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "No token" });
    return;
  }
  try {
    const decoded = jwt.verify(token, SECRET) as { id: number; username: string; role: string };
    res.json(decoded);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/change-password", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  const token = authHeader.split(" ")[1];
  const { current_password, new_password } = req.body as {
    current_password?: string;
    new_password?: string;
  };

  if (!current_password || !new_password) {
    res.status(400).json({ error: "Current and new password required" });
    return;
  }
  if (new_password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  if (new_password.length > 128) {
    res.status(400).json({ error: "Password too long" });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET) as { id: number };

    const [user] = await db
      .select({ id: usersTable.id, passwordHash: usersTable.passwordHash })
      .from(usersTable)
      .where(eq(usersTable.id, decoded.id))
      .limit(1);

    if (!user || !(await bcrypt.compare(current_password, user.passwordHash))) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await db
      .update(usersTable)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(usersTable.id, decoded.id));

    logger.info({ userId: decoded.id }, "Password changed");
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    logger.error({ err }, "Change password error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
