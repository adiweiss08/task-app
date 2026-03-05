import { Hono } from "hono";
import {
  CreateBirthdaySchema,
  CreateTodoSchema,
  UpdateTodoSchema,
  Birthday,
  Todo,
} from "../shared/types";

const app = new Hono<{ Bindings: Env }>();

// Get all todos
app.get("/api/todos", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM todos ORDER BY created_at DESC"
  ).all<any>();

  const todos = result.results.map((row) => ({
    ...row,
    subtasks: row.subtasks ? JSON.parse(row.subtasks as string) : [],
  })) as Todo[];

  return c.json(todos);
});

// Create a todo
app.post("/api/todos", async (c) => {
  const body = await c.req.json();
  const parsed = CreateTodoSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }

  const { title, priority, category, due_date, image_url, subtasks } = parsed.data;

  const result = await c.env.DB.prepare(
    "INSERT INTO todos (title, priority, category, due_date, image_url, subtasks) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
  )
    .bind(
      title,
      priority,
      category,
      due_date || null,
      image_url || null,
      JSON.stringify(subtasks ?? [])
    )
    .first<any>();

  const todo: Todo = {
    ...result,
    subtasks: result.subtasks ? JSON.parse(result.subtasks as string) : [],
  };

  return c.json(todo, 201);
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
  if (updates.image_url !== undefined) {
    fields.push("image_url = ?");
    values.push(updates.image_url);
  }
  if (updates.subtasks !== undefined) {
    fields.push("subtasks = ?");
    values.push(JSON.stringify(updates.subtasks));
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
    .first<any>();

  if (!result) {
    return c.json({ error: "Todo not found" }, 404);
  }

  const todo: Todo = {
    ...result,
    subtasks: result.subtasks ? JSON.parse(result.subtasks as string) : [],
  };

  return c.json(todo);
});

// Delete a todo
app.delete("/api/todos/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  await c.env.DB.prepare("DELETE FROM todos WHERE id = ?").bind(id).run();

  return c.json({ success: true });
});

// Birthdays CRUD
app.get("/api/birthdays", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM birthdays ORDER BY date ASC"
  ).all<Birthday>();

  return c.json(result.results);
});

app.post("/api/birthdays", async (c) => {
  const body = await c.req.json();
  const parsed = CreateBirthdaySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.issues }, 400);
  }

  const { name, date } = parsed.data;

  const result = await c.env.DB.prepare(
    "INSERT INTO birthdays (name, date) VALUES (?, ?) RETURNING *"
  )
    .bind(name, date)
    .first<Birthday>();

  return c.json(result, 201);
});

app.delete("/api/birthdays/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  await c.env.DB.prepare("DELETE FROM birthdays WHERE id = ?").bind(id).run();

  return c.json({ success: true });
});

export default app;
