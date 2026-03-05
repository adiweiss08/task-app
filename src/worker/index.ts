import { Hono } from "hono";
import { Client } from "pg";

const app = new Hono<{ Bindings: Env }>();

const getPgClient = async (env: Env) => {
  const client = new Client({
    connectionString: env.HYPERDRIVE?.connectionString || env.DATABASE_URL,
  });
  await client.connect();
  return client;
};

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
    return c.json(result.rows.map(parseTodo));
  } finally { await client.end(); }
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
    if (body.subtasks !== undefined) { fields.push(`subtasks = $${idx++}`); values.push(JSON.stringify(body.subtasks)); }

    if (fields.length === 0) return c.json({ error: "No fields to update" }, 400);
    values.push(id);
    
    const result = await client.query(
      `UPDATE todos SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) return c.json({ error: "Not found" }, 404);
    return c.json(parseTodo(result.rows[0]));
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  } finally { await client.end(); }
});

export default app;