import { useState, useMemo, useRef, useEffect, type ChangeEvent } from "react";
import { Search, X, ArrowUpDown, StickyNote, CalendarDays, LogOut, BarChart3, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";
import { Input } from "@/react-app/components/ui/input";
import { useAuth } from "@/react-app/context/AuthContext";
import { useTodos } from "@/react-app/hooks/useTodos";
import { ProgressHeader } from "@/react-app/components/ProgressHeader";
import { TaskForm, AddTaskTrigger } from "@/react-app/components/TaskForm";
import { TodoItem } from "@/react-app/components/TodoItem";
import type { Category, CategoryOption, FilterStatus, Priority, SortOption } from "@/react-app/types/todo";
import { BASE_CATEGORIES } from "@/react-app/types/todo";

export default function HomePage() {
  const { user, logout } = useAuth();
  const {
    todos,
    toggleTodo,
    addTodo,
    deleteTodo,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    removeImageFromTodo,
    addImageToTodo,
    clearCompleted,
  } = useTodos();

  const [filter, setFilter] = useState<FilterStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newCategory, setNewCategory] = useState<Category>("personal");
  const [newDueDate, setNewDueDate] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<CategoryOption[]>(BASE_CATEGORIES);

  useEffect(() => {
    try {
      const savedView = window.localStorage.getItem("mytasks_view_mode");
      if (savedView === "grid" || savedView === "list") {
        setViewMode(savedView);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("mytasks_view_mode", viewMode);
    } catch {}
  }, [viewMode]);

  const filteredAndSortedTodos = useMemo(() => {
    let result = todos.filter((todo) => {
      const statusMatch =
        filter === "all" || (filter === "completed" ? todo.completed : !todo.completed);
      const categoryMatch = categoryFilter === "all" || todo.category === categoryFilter;
      const searchMatch =
        !searchQuery || todo.title.toLowerCase().includes(searchQuery.toLowerCase());
      return statusMatch && categoryMatch && searchMatch;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.createdAt - b.createdAt;
        case "priority": {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case "dueDate": {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return result;
  }, [todos, filter, categoryFilter, searchQuery, sortBy]);

  const handleNewTaskImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      window.alert("The image is too big. Please choose an image smaller than 5MB.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitNewTask = async () => {
    const ok = await addTodo({
      title: newTask,
      category: newCategory,
      priority: newPriority,
      dueDate: newDueDate,
      imageBase64: newImage,
    });
    if (ok) {
      setNewTask("");
      setNewPriority("medium");
      setNewCategory("personal");
      setNewDueDate("");
      setNewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-200">
              <StickyNote className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">My Tasks</h1>
              <p className="text-muted-foreground">Organize your tasks efficiently</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Link
              to="/birthdays"
              className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/70 px-4 py-2 text-sm font-medium text-pink-700 shadow-sm hover:bg-white hover:shadow-md transition-all"
            >
              <CalendarDays className="h-4 w-4" />
              My Calendar
            </Link>
            <Link
              to="/stats"
              className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/70 px-4 py-2 text-sm font-medium text-pink-700 shadow-sm hover:bg-white hover:shadow-md transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              Task Insights
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/70 px-4 py-2 text-sm font-medium text-pink-700 shadow-sm hover:bg-white hover:shadow-md transition-all"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
              {user?.username || "Log out"}
            </button>
          </div>
        </header>

        <ProgressHeader
          completedCount={completedCount}
          totalCount={totalCount}
          onClearCompleted={clearCompleted}
        />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 border-pink-200 focus-visible:ring-pink-300"
            />
          </div>
          <div className="flex items-center gap-3 mt-1 sm:mt-0">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-pink-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="priority">By priority</option>
                <option value="dueDate">By due date</option>
              </select>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-pink-200 bg-white/80 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 text-xs font-medium rounded-lg ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-pink-50"
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 text-xs font-medium rounded-lg ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-pink-50"
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-white/80 p-1 shadow-sm border border-pink-100">
            {(["all", "active", "completed"] as FilterStatus[]).map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  filter === status
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-pink-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                categoryFilter === "all"
                  ? "bg-foreground text-white"
                  : "bg-white/80 text-muted-foreground hover:bg-white border border-pink-200"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                  categoryFilter === cat.value
                    ? `${cat.bg} ${cat.color}`
                    : "bg-white/80 text-muted-foreground hover:bg-white border-pink-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {!showAddForm ? (
          <AddTaskTrigger onClick={() => setShowAddForm(true)} />
        ) : (
          <TaskForm
            newTask={newTask}
            setNewTask={setNewTask}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            newPriority={newPriority}
            setNewPriority={setNewPriority}
            newDueDate={newDueDate}
            setNewDueDate={setNewDueDate}
            newImage={newImage}
            setNewImage={setNewImage}
            categories={categories}
            setCategories={setCategories}
            fileInputRef={fileInputRef}
            onSubmit={handleSubmitNewTask}
            onCancel={() => setShowAddForm(false)}
            onImageSelect={handleNewTaskImageSelect}
          />
        )}

        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3"
          }
        >
          {filteredAndSortedTodos.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
                <CheckCircle2 className="h-8 w-8 text-pink-300" />
              </div>
              <p className="text-muted-foreground">No tasks found</p>
              <p className="text-sm text-muted-foreground/60">Add a new task to get started</p>
            </div>
          ) : (
            filteredAndSortedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onRemoveImage={removeImageFromTodo}
                onAddImage={addImageToTodo}
                onExpandImage={setExpandedImage}
                onAddSubtask={addSubtask}
                onToggleSubtask={toggleSubtask}
                onDeleteSubtask={deleteSubtask}
              />
            ))
          )}
        </div>
      </div>

      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={expandedImage}
              alt="Expanded task image"
              className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setExpandedImage(null)}
              className="absolute -top-3 -right-3 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
