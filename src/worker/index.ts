import { Hono } from "hono";
import { Client } from "pg";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors({
  origin: [
    "http://localhost:5173",
    "https://adi-task.adi-weiss08.workers.dev",
    "https://front-app-dd1.pages.dev"
  ],
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ['Content-Type', "Authorization", 'Cache-Control', 'Pragma'],
  exposeHeaders: ['Content-Length', "Authorization"],
  maxAge: 600,
  credentials: true,
}));

let cachedClient: Client | null = null;

export async function getPgClient(env: Env): Promise<Client> {
  // 1. אם יש לקוח בזיכרון, נבדוק שהוא לא סגור
  if (cachedClient) {
    // בדיקה האם הלקוח עדיין מחובר (Property פנימי של pg)
    // @ts-ignore
    if (cachedClient._connected && !cachedClient._ending) {
      return cachedClient;
    }
    // אם הוא סגור, ננקה אותו ונמשיך ליצירת חדש
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

// פונקציית עזר קריטית: מוודאת שהנתונים חוזרים ל-React בפורמט הנכון
const parseTodo = (row: any) => ({
  ...row,
  is_completed: Boolean(row.is_completed),
  // וידוא שה-subtasks הם תמיד מערך (Array) ולא מחרוזת
  subtasks: typeof row.subtasks === 'string' ? JSON.parse(row.subtasks) : (row.subtasks || [])
});

app.get("/api/todos", async (c) => {
  const client = await getPgClient(c.env);
  try {
    const result = await client.query("SELECT * FROM todos ORDER BY created_at DESC");
    return c.json(result.rows.map(parseTodo), 200, {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return c.json({ error: "Failed to fetch todos" }, 500);
  } finally {
    await client.end();
  }
});

app.post("/api/todos", async (c) => {
  const body = await c.req.json();
  const client = await getPgClient(c.env);
  try {
    const result = await client.query(
      "INSERT INTO todos (title, priority, category, subtasks) VALUES ($1, $2, $3, $4) RETURNING *",
      [body.title, body.priority || 'medium', body.category || 'personal', JSON.stringify(body.subtasks || [])]
    );
    return c.json(parseTodo(result.rows[0]), 201);
  } finally { await client.end(); }
});

app.patch("/api/todos/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const client = await getPgClient(c.env);
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (body.title !== undefined) { fields.push(`title = $${idx++}`); values.push(body.title); }
    if (body.image_url !== undefined) { fields.push(`image_url = $${idx++}`); values.push(body.image_url); }
    if (body.is_completed !== undefined) { fields.push(`is_completed = $${idx++}`); values.push(body.is_completed); }
    if (body.subtasks !== undefined) {
      fields.push(`subtasks = $${idx++}`);
      // ודואים שהסאב-טאסקים נשמרים כסטרינג של JSON
      values.push(JSON.stringify(body.subtasks));
    }

    if (fields.length === 0) return c.json({ error: "No fields to update" }, 400);

    values.push(id); // ה-ID תמיד יהיה ה-Value האחרון

    const result = await client.query(
      `UPDATE todos SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return c.json({ error: "Not found" }, 404);

    // --- התיקון כאן: הוספת Headers למניעת Caching של המצב הישן ---
    return c.json(parseTodo(result.rows[0]), 200, {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });
  } catch (e: any) {
    console.error("Patch error:", e);
    return c.json({ error: e.message }, 500);
  } finally {
    await client.end();
  }
});

app.delete("/api/todos/:id", async (c) => {
  const id = c.req.param("id");
  const client = await getPgClient(c.env);
  try {
    const result = await client.query("DELETE FROM todos WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  } finally {
    await client.end();
  }
});

export default app;