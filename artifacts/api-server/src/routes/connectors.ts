// src/routes/connectors.ts
import { Router } from "express";
import { pool } from "@workspace/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

function getUserFromToken(req: any): string | null {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { username?: string };
    return decoded.username ?? null;
  } catch { return null; }
}

export const connectorsRouter = Router();

connectorsRouter.get("/:name", async (req, res): Promise<void> => {
  const { name } = req.params;
  const result = await pool.query(
    `SELECT * FROM connectors WHERE name = $1 LIMIT 1`,
    [name]
  );

  if (result.rows.length === 0) {
    res.json({ id: null, name, config: {}, status: "disconnected", isActive: false });
    return;
  }

  res.json(result.rows[0]);
});

connectorsRouter.patch("/:name", async (req, res): Promise<void> => {
  const { config, status, isActive } = req.body;
  const name = req.params.name;
  const updatedBy = getUserFromToken(req);

  // Upsert by name (id is serial auto-increment)
  const existing = await pool.query(
    `SELECT id FROM connectors WHERE name = $1 LIMIT 1`,
    [name]
  );

  if (existing.rows.length > 0) {
    const result = await pool.query(
      `UPDATE connectors SET config = COALESCE($1, config), status = COALESCE($2, status), is_active = COALESCE($3, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
      [config || null, status || null, isActive ?? null, existing.rows[0].id]
    );
    res.json(result.rows[0]);
  } else {
    const result = await pool.query(
      `INSERT INTO connectors (name, type, config, status, is_active, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, name, config || {}, status || "disconnected", isActive ?? true, updatedBy]
    );
    res.json(result.rows[0]);
  }
});
