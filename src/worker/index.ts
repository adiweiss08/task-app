import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { Client } from "pg";
import { cors } from "hono/cors";
import { withDb } from "./db";
import { hashPassword, verifyPassword } from "./auth";
import { signToken, verifyToken } from "./jwt";

const app = new Hono<{
  Bindings: Env;
  Variables: {
    userId: number;
    username: string;
  };
}>();

app.use(
  "/api/*",
  cors({
    origin: [
      "http://localhost:5173",
      "https://adi-task.adi-weiss08.workers.dev",
      "https://front-app-dd1.pages.dev",
    ],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cache-Control", "Pragma"],
    exposeHeaders: ["Content-Length", "Authorization"],
    maxAge: 600,
    credentials: true,
  })
);

let cachedClient: Client | null = null;

type PgClientInternals = { _connected?: boolean; _ending?: boolean };

export async function getPgClient(env: Env): Promise<Client> {
  if (cachedClient) {
    const internal = cachedClient as unknown as PgClientInternals;
    if (internal._connected && !internal._ending) {
      return cachedClient;
    }
    cachedClient = null;
  }

  const connectionString = env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is missing!");

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    cachedClient = client;
    return client;
  } catch (error) {
    cachedClient = null;
    throw error;
  }
}

const authMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: { userId: number; username: string };
}> = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.slice(7);
  const secret = c.env.JWT_SECRET;
  if (!secret) return c.json({ error: "Server configuration error" }, 500);
  const payload = await verifyToken(token, secret);
  if (!payload) return c.json({ error: "Invalid or expired token" }, 401);
  c.set("userId", payload.userId);
  c.set("username", payload.username);
  await next();
};

app.post("/api/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body as { username?: string; password?: string };
    if (!username || typeof username !== "string" || !password || typeof password !== "string") {
      return c.json({ error: "Username and password required" }, 400);
    }
    const u = username.trim().toLowerCase();
    if (u.length < 3) return c.json({ error: "Username must be at least 3 characters" }, 400);
    if (password.length < 6) return c.json({ error: "Password must be at least 6 characters" }, 400);

    const password_hash = await hashPassword(password);
    const client = await getPgClient(c.env);
    try {
      const result = await client.query(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
        [u, password_hash]
      );
      const row = result.rows[0];
      const token = await signToken(
        { userId: row.id, username: row.username },
        c.env.JWT_SECRET
      );
      return c.json({ token, user: { id: row.id, username: row.username } }, 201);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === "23505") return c.json({ error: "Username already exists" }, 409);
      throw e;
    } finally {
      c.executionCtx.waitUntil(client.end());
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Signup failed";
    return c.json({ error: message }, 500);
  }
});

app.post("/api/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body as { username?: string; password?: string };
    if (!username || !password) {
      return c.json({ error: "Username and password required" }, 400);
    }
    const u = username.trim().toLowerCase();
    const client = await getPgClient(c.env);
    try {
      const result = await client.query(
        "SELECT id, username, password_hash FROM users WHERE username = $1",
        [u]
      );
      if (result.rows.length === 0) {
        return c.json({ error: "Invalid credentials" }, 401);
      }
      const row = result.rows[0];
      const ok = await verifyPassword(row.password_hash, password);
      if (!ok) return c.json({ error: "Invalid credentials" }, 401);
      const token = await signToken(
        { userId: row.id, username: row.username },
        c.env.JWT_SECRET
      );
      return c.json({ token, user: { id: row.id, username: row.username } });
    } finally {
      c.executionCtx.waitUntil(client.end());
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Login failed";
    return c.json({ error: message }, 500);
  }
});

function parseTodo(row: Record<string, unknown>) {
  const formatDate = (dateVal: unknown) => {
    if (!dateVal) return null;
    const d = new Date(dateVal as string | number | Date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  };

  const rawSubtasks = row.subtasks;
  const subtasks =
    typeof rawSubtasks === "string"
      ? (JSON.parse(rawSubtasks) as unknown[])
      : Array.isArray(rawSubtasks)
        ? rawSubtasks
        : [];

  return {
    ...row,
    category: row.category || (row as { Category?: string }).Category || "General",
    is_completed: Boolean(row.is_completed),
    created_at: formatDate(row.created_at),
    due_date: formatDate(row.due_date),
    image_url: row.image_url ?? null,
    subtasks,
  };
}

function parseBirthday(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name || (row as { Name?: string }).Name,
    type: row.type || (row as { Type?: string }).Type || "birthday",
    date: row.date || (row as { Date?: string }).Date,
  };
}

const api = app.basePath("/api");

api.use("/todos/*", authMiddleware);
api.use("/todos", authMiddleware);
api.use("/birthdays/*", authMiddleware);
api.use("/birthdays", authMiddleware);

api.get("/todos", async (c) => {
  const userId = c.get("userId");
  const client = await getPgClient(c.env);
  try {
    const result = await client.query(
      "SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    const data = result.rows.map((r) => parseTodo(r as Record<string, unknown>));
    return c.json(data, 200, {
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Cache-Control": "no-store",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return c.json({ error: message }, 500);
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

api.post("/todos", async (c) => {
  const userId = c.get("userId");
  const body = (await c.req.json()) as Record<string, unknown>;

  return await withDb(c.env, async (client) => {
    try {
      const dueRaw = (body.due_date ?? body.dueDate) as string | undefined;
      const dueDate =
        dueRaw && String(dueRaw).trim()
          ? String(dueRaw).split("T")[0]
          : new Date().toISOString().split("T")[0];

      const result = await client.query(
        "INSERT INTO todos (title, priority, category, subtasks, due_date, user_id, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [
          body.title,
          String(body.priority || (body as { Priority?: string }).Priority || "medium").toLowerCase(),
          String(body.category || (body as { Category?: string }).Category || "personal").toLowerCase(),
          JSON.stringify(body.subtasks || []),
          dueDate,
          userId,
          body.image_url ?? null,
        ]
      );
      return c.json(parseTodo(result.rows[0] as Record<string, unknown>), 201);
    } catch (error) {
      console.error("Database Error:", error);
      return c.json({ error: "Failed to create todo" }, 500);
    }
  });
});

api.patch("/todos/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = (await c.req.json()) as Record<string, unknown>;
  const client = await getPgClient(c.env);
  try {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (body.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(body.title);
    }
    if (body.image_url !== undefined) {
      fields.push(`image_url = $${idx++}`);
      values.push(body.image_url);
    }
    if (body.is_completed !== undefined) {
      fields.push(`is_completed = $${idx++}`);
      values.push(body.is_completed);
    }
    if (body.subtasks !== undefined) {
      fields.push(`subtasks = $${idx++}`);
      values.push(JSON.stringify(body.subtasks));
    }

    if (fields.length === 0) return c.json({ error: "No fields to update" }, 400);

    values.push(userId, id);
    const result = await client.query(
      `UPDATE todos SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx + 1} AND user_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return c.json({ error: "Not found" }, 404);

    return c.json(parseTodo(result.rows[0] as Record<string, unknown>), 200, {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
  } catch (e: unknown) {
    console.error("Patch error:", e);
    const message = e instanceof Error ? e.message : "Error";
    return c.json({ error: message }, 500);
  } finally {
    await client.end();
  }
});

api.delete("/todos/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const client = await getPgClient(c.env);
  try {
    const result = await client.query("DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id", [
      id,
      userId,
    ]);
    if (result.rowCount === 0) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return c.json({ error: message }, 500);
  } finally {
    await client.end();
  }
});

api.get("/birthdays", async (c) => {
  const userId = c.get("userId");
  const client = await getPgClient(c.env);
  try {
    const result = await client.query(
      "SELECT * FROM birthdays WHERE user_id = $1 ORDER BY date ASC",
      [userId]
    );
    const data = result.rows.map((r) => parseBirthday(r as Record<string, unknown>));
    return c.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return c.json({ error: message }, 500);
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

api.post("/birthdays", async (c) => {
  const userId = c.get("userId");

  if (!userId) {
    return c.json({ error: "Unauthorized - No user ID found" }, 401);
  }

  const body = await c.req.json();
  const client = await getPgClient(c.env);

  try {
    const result = await client.query(
      "INSERT INTO birthdays (name, date, type, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [
        (body as { name: string }).name,
        String((body as { date: string }).date).split("T")[0],
        (body as { type?: string }).type || "birthday",
        userId,
      ]
    );

    const response = c.json(parseBirthday(result.rows[0] as Record<string, unknown>), 201, {
      "Access-Control-Allow-Origin": "http://localhost:5173",
    });

    c.executionCtx.waitUntil(client.end());
    return response;
  } catch (error: unknown) {
    console.error("Database Error:", error instanceof Error ? error.message : error);
    c.executionCtx.waitUntil(client.end());
    return c.json({ error: "Failed to save birthday" }, 500);
  }
});

api.delete("/birthdays/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const client = await getPgClient(c.env);

  try {
    const result = await client.query("DELETE FROM birthdays WHERE id = $1 AND user_id = $2 RETURNING id", [
      id,
      userId,
    ]);

    if (result.rowCount === 0) {
      return c.json({ error: "Birthday not found" }, 404);
    }

    return c.json({ message: "Deleted successfully" }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error";
    return c.json({ error: message }, 500);
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
});

export default app;
