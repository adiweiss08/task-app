
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT 0,
  priority TEXT NOT NULL,
  category TEXT NOT NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_todos_is_completed ON todos(is_completed);
CREATE INDEX idx_todos_category ON todos(category);
