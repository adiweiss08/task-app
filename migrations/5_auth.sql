-- Migration 5: Add authentication and user isolation (PostgreSQL/Neon)
-- Run this against your Neon PostgreSQL database

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add user_id to todos (nullable first for existing rows)
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);

-- 3. Add user_id to birthdays
ALTER TABLE birthdays ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_birthdays_user_id ON birthdays(user_id);
