import { Hono } from "hono";
import { CreateTodoSchema, UpdateTodoSchema, Todo } from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// Get all todos
app.get("/api/todos", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM todos ORDER BY created_at DESC"
  ).all<Todo>();
  return c.json(result.results);
});

// Create a todo
app.post("/api/todos", async (c) => {
  const body = await c.req.json();
  const parsed = CreateTodoSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }
  
  const { title, priority, category, due_date } = parsed.data;
  
  const result = await c.env.DB.prepare(
    "INSERT INTO todos (title, priority, category, due_date) VALUES (?, ?, ?, ?) RETURNING *"
  )
    .bind(title, priority, category, due_date || null)
    .first<Todo>();
  
  return c.json(result, 201);
});

// Update a todo
app.patch("/api/todos/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const parsed = UpdateTodoSchema.safeParse(body);
  
  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }
  
  const updates = parsed.data;
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.is_completed !== undefined) {
    fields.push("is_completed = ?");
    values.push(updates.is_completed);
  }
  if (updates.priority !== undefined) {
    fields.push("priority = ?");
    values.push(updates.priority);
  }
  if (updates.category !== undefined) {
    fields.push("category = ?");
    values.push(updates.category);
  }
  if (updates.due_date !== undefined) {
    fields.push("due_date = ?");
    values.push(updates.due_date);
  }
  
  if (fields.length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }
  
  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  
  const result = await c.env.DB.prepare(
    `UPDATE todos SET ${fields.join(", ")} WHERE id = ? RETURNING *`
  )
    .bind(...values)
    .first<Todo>();
  
  if (!result) {
    return c.json({ error: "Todo not found" }, 404);
  }
  
  return c.json(result);
});

// Delete a todo
app.delete("/api/todos/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  
  // Get the todo first to check for image
  const todo = await c.env.DB.prepare(
    "SELECT image_key FROM todos WHERE id = ?"
  ).bind(id).first<{ image_key: string | null }>();
  
  if (!todo) {
    return c.json({ error: "Todo not found" }, 404);
  }
  
  // Delete the image from R2 if it exists
  if (todo.image_key) {
    await c.env.R2_BUCKET.delete(todo.image_key);
  }
  
  await c.env.DB.prepare("DELETE FROM todos WHERE id = ?").bind(id).run();
  
  return c.json({ success: true });
});

// Upload image for a todo
app.post("/api/todos/:id/image", async (c) => {
  const id = parseInt(c.req.param("id"));
  
  // Check if todo exists
  const todo = await c.env.DB.prepare(
    "SELECT id, image_key FROM todos WHERE id = ?"
  ).bind(id).first<{ id: number; image_key: string | null }>();
  
  if (!todo) {
    return c.json({ error: "Todo not found" }, 404);
  }
  
  // Delete old image if exists
  if (todo.image_key) {
    await c.env.R2_BUCKET.delete(todo.image_key);
  }
  
  const formData = await c.req.formData();
  const file = formData.get("image") as File | null;
  
  if (!file) {
    return c.json({ error: "No image provided" }, 400);
  }
  
  const key = `todos/${id}/${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  
  await c.env.R2_BUCKET.put(key, arrayBuffer, {
    httpMetadata: { contentType: file.type }
  });
  
  // Update todo with image key
  const result = await c.env.DB.prepare(
    "UPDATE todos SET image_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *"
  ).bind(key, id).first();
  
  return c.json(result);
});

// Get image for a todo
app.get("/api/images/:key{.+}", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.R2_BUCKET.get(key);
  
  if (!object) {
    return c.json({ error: "Image not found" }, 404);
  }
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000");
  
  return c.body(object.body, { headers });
});

// Delete image from a todo
app.delete("/api/todos/:id/image", async (c) => {
  const id = parseInt(c.req.param("id"));
  
  const todo = await c.env.DB.prepare(
    "SELECT image_key FROM todos WHERE id = ?"
  ).bind(id).first<{ image_key: string | null }>();
  
  if (!todo) {
    return c.json({ error: "Todo not found" }, 404);
  }
  
  if (todo.image_key) {
    await c.env.R2_BUCKET.delete(todo.image_key);
  }
  
  await c.env.DB.prepare(
    "UPDATE todos SET image_key = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(id).run();
  
  return c.json({ success: true });
});

export default app;
