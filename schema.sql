-- PostgreSQL schema for task-app (run this once against your Postgres DB)

CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date DATE,
  image_key TEXT,
  image_url TEXT,
  subtasks TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_todos_is_completed ON todos(is_completed);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);

CREATE TABLE IF NOT EXISTS birthdays (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'birthday'
);
