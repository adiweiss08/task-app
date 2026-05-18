export type Priority = "low" | "medium" | "high";
export type Category = string;
export type FilterStatus = "all" | "active" | "completed";
export type SortOption = "newest" | "oldest" | "priority" | "dueDate";

export interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: string | null;
  imageUrl: string | null;
  subtasks: Subtask[];
  createdAt: number;
}

export interface CategoryOption {
  value: Category;
  label: string;
  color: string;
  bg: string;
}

export const BASE_CATEGORIES: CategoryOption[] = [
  { value: "work", label: "Work", color: "text-blue-600", bg: "bg-blue-100 border-blue-200" },
  { value: "personal", label: "Personal", color: "text-purple-600", bg: "bg-purple-100 border-purple-200" },
  { value: "health", label: "Health", color: "text-emerald-600", bg: "bg-emerald-100 border-emerald-200" },
  { value: "shopping", label: "Shopping", color: "text-amber-600", bg: "bg-amber-100 border-amber-200" },
  { value: "other", label: "Other", color: "text-gray-600", bg: "bg-gray-100 border-gray-200" },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function getCategoryStyle(category: Category): CategoryOption {
  const found = BASE_CATEGORIES.find((c) => c.value === category);
  if (found) return found;
  return {
    value: category,
    label: category,
    color: "text-gray-700",
    bg: "bg-gray-100 border-gray-200",
  };
}

export function mapApiTodoToUi(todo: Record<string, unknown>): Todo {
  const subtasksRaw = todo.subtasks;
  const subtasks = Array.isArray(subtasksRaw) ? (subtasksRaw as Subtask[]) : [];

  const createdRaw = todo.created_at;
  const createdAt =
    typeof createdRaw === "string" || createdRaw instanceof Date
      ? new Date(createdRaw as string).getTime()
      : Date.now();

  return {
    id: Number(todo.id),
    title: String(todo.title ?? ""),
    completed: Boolean(todo.is_completed),
    priority: (todo.priority as Priority) || "medium",
    category: String(todo.category ?? "personal"),
    dueDate: todo.due_date != null ? String(todo.due_date) : null,
    imageUrl: todo.image_url != null ? String(todo.image_url) : null,
    subtasks,
    createdAt,
  };
}
