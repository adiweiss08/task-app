import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Calendar, Flag, CheckCircle2, Circle, Search, X, Tag, Clock, ArrowUpDown, StickyNote, ImagePlus, Trash2, ListTodo, Square, CheckSquare, CalendarDays } from "lucide-react";
import { Link } from "react-router";
import { BarChart3 } from "lucide-react"; 
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Badge } from "@/react-app/components/ui/badge";
import { Progress } from "@/react-app/components/ui/progress";

type Priority = "low" | "medium" | "high";
type Category = string;
type FilterStatus = "all" | "active" | "completed";
type SortOption = "newest" | "oldest" | "priority" | "dueDate";

interface Subtask {
  id: number;
  title: string;
  completed: boolean;
}

interface Todo {
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

const baseCategories: { value: Category; label: string; color: string; bg: string }[] = [
  { value: "work", label: "Work", color: "text-blue-600", bg: "bg-blue-100 border-blue-200" },
  { value: "personal", label: "Personal", color: "text-purple-600", bg: "bg-purple-100 border-purple-200" },
  { value: "health", label: "Health", color: "text-emerald-600", bg: "bg-emerald-100 border-emerald-200" },
  { value: "shopping", label: "Shopping", color: "text-amber-600", bg: "bg-amber-100 border-amber-200" },
  { value: "other", label: "Other", color: "text-gray-600", bg: "bg-gray-100 border-gray-200" },
];

const priorities: { value: Priority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const getCategoryStyle = (category: Category) => {
  const found = baseCategories.find((c) => c.value === category);
  if (found) return found;
  return {
    value: category,
    label: category,
    color: "text-gray-700",
    bg: "bg-gray-100 border-gray-200",
  };
};

export default function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newCategory, setNewCategory] = useState<Category>("personal");
  const [newDueDate, setNewDueDate] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState(baseCategories);
  
  useEffect(() => {
      fetch('http://localhost:5000/tasks')
        .then((res) => res.json())
        .then((data) => {
          setTodos(data);
        })
        .catch((err) => console.error("Error fetching tasks:", err));
    }, []);

  const filteredAndSortedTodos = useMemo(() => {
    let result = todos.filter((todo) => {
      const statusMatch = filter === "all" || (filter === "completed" ? todo.completed : !todo.completed);
      const categoryMatch = categoryFilter === "all" || todo.category === categoryFilter;
      const searchMatch = !searchQuery || todo.title.toLowerCase().includes(searchQuery.toLowerCase());
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

  const toggleTodo = (id: number) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

const addTodo = () => {
  if (!newTask.trim()) return;

  // 1. יוצרים את האובייקט (בלי ID, השרת יוצר אותו לבד)
  const newTodo = {
    title: newTask,
    completed: false,
    priority: newPriority,
    category: newCategory,
    dueDate: newDueDate || null,
    imageUrl: newImage,
    subtasks: [],
    createdAt: Date.now(),
  };

    fetch('http://localhost:5000/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTodo),
    })
      .then((res) => res.json())
      .then((savedTodo) => {
        setTodos([savedTodo, ...todos]);
        
        setNewTask("");
        setNewDueDate("");
        setNewImage(null);
        setShowAddForm(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      })
      .catch((err) => console.error("Error adding task:", err));
  };

  const deleteTodo = (id: number) => {
    fetch(`http://localhost:5000/tasks/${id}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (res.ok) {
          setTodos(todos.filter((todo) => todo.id !== id));
        } else {
          console.error("Failed to delete from server");
        }
      })
      .catch((err) => console.error("Error deleting task:", err));
  };

  const removeImage = (id: number) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, imageUrl: null } : todo)));
  };

  const addImageToTodo = (id: number, imageUrl: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, imageUrl } : todo)));
  };

  const addSubtask = (todoId: number, title: string) => {
    setTodos(todos.map((todo) => {
      if (todo.id === todoId) {
        const newSubtask: Subtask = {
          id: Date.now(),
          title,
          completed: false,
        };
        return { ...todo, subtasks: [...todo.subtasks, newSubtask] };
      }
      return todo;
    }));
  };

  const toggleSubtask = (todoId: number, subtaskId: number) => {
    setTodos(todos.map((todo) => {
      if (todo.id === todoId) {
        return {
          ...todo,
          subtasks: todo.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
        };
      }
      return todo;
    }));
  };

  const deleteSubtask = (todoId: number, subtaskId: number) => {
    setTodos(todos.map((todo) => {
      if (todo.id === todoId) {
        return {
          ...todo,
          subtasks: todo.subtasks.filter((st) => st.id !== subtaskId),
        };
      }
      return todo;
    }));
  };

  const clearCompleted = () => {
    const completedTodos = todos.filter(t => t.completed);

    completedTodos.forEach(todo => {
      deleteTodo(todo.id);
    });
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Header */}
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
            
          </div>
        </header>

        {/* Progress Section */}
        <div className="mb-8 rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-sm border border-pink-100">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Your Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} tasks
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="mt-3 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Clear completed tasks
            </button>
          )}
        </div>

        {/* Search & Sort */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 border-pink-200 focus-visible:ring-pink-300"
            />
          </div>
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
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-white/80 p-1 shadow-sm border border-pink-100">
            {(["all", "active", "completed"] as FilterStatus[]).map((status) => (
              <button
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

        {/* Add Task Button / Form */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="mb-6 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-pink-200 bg-white/50 px-5 py-5 text-left text-muted-foreground transition-all hover:border-pink-400 hover:bg-white/80 hover:shadow-sm group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-sm group-hover:shadow-md transition-shadow">
              <Plus className="h-5 w-5" />
            </div>
            <span className="font-medium">Add a new task...</span>
          </button>
        ) : (
          <div className="mb-6 rounded-2xl border border-pink-200 bg-white p-5 shadow-lg">
            <Input
              placeholder="What needs to be done?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              autoFocus
              className="mb-4 border-0 bg-transparent px-0 text-lg font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0"
            />
            
            {/* Image Preview */}
            {newImage && (
              <div className="mb-4 relative inline-block">
                <img 
                  src={newImage} 
                  alt="Task preview" 
                  className="h-24 w-auto rounded-lg object-cover border border-pink-200"
                />
                <button
                  onClick={() => {
                    setNewImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <select
                  value={newCategory}
                  onChange={(e) => {
                    const value = e.target.value as Category;
                    if (value === "__new__") {
                      const label = window.prompt("New type name (for example: School, Hobby)");
                      if (label && label.trim()) {
                        const trimmed = label.trim();
                        const slug = trimmed.toLowerCase().replace(/\s+/g, "-");
                        const newCat = {
                          value: slug,
                          label: trimmed,
                          color: "text-gray-700",
                          bg: "bg-gray-100 border-gray-200",
                        };
                        setCategories((prev) => [...prev, newCat]);
                        setNewCategory(slug);
                      }
                      return;
                    }
                    setNewCategory(value);
                  }}
                  className="rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                  <option value="__new__">+ Add new type…</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className="rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
              
              {/* Image Upload Button */}
              <label className="flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-1.5 text-sm cursor-pointer hover:bg-pink-100/50 transition-colors">
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Image</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>

              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowAddForm(false);
                  setNewImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}>
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={addTodo} 
                  disabled={!newTask.trim()}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                >
                  Add Task
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                onRemoveImage={removeImage}
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

      {/* Image Modal */}
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

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onRemoveImage: (id: number) => void;
  onAddImage: (id: number, imageUrl: string) => void;
  onExpandImage: (imageUrl: string) => void;
  onAddSubtask: (todoId: number, title: string) => void;
  onToggleSubtask: (todoId: number, subtaskId: number) => void;
  onDeleteSubtask: (todoId: number, subtaskId: number) => void;
}

function TodoItem({ todo, onToggle, onDelete, onRemoveImage, onAddImage, onExpandImage, onAddSubtask, onToggleSubtask, onDeleteSubtask }: TodoItemProps) {
  const categoryStyle = getCategoryStyle(todo.category);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  
  const completedSubtasks = todo.subtasks.filter((st) => st.completed).length;
  const totalSubtasks = todo.subtasks.length;

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask(todo.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
    }
  };
  
  const priorityStyles: Record<Priority, string> = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAddImage(todo.id, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`group h-full rounded-2xl border bg-white transition-all hover:-translate-y-1 hover:shadow-lg ${
        categoryStyle.bg.replace("bg-", "border-").replace("-100", "-200")
      } ${todo.completed ? "opacity-60" : ""}`}
    >
      <div className="flex h-full flex-col p-4">
        <div className="flex items-start gap-2">
          <button
            onClick={() => onToggle(todo.id)}
            className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
          >
            {todo.completed ? (
              <CheckCircle2 className="h-5 w-5 text-pink-500" />
            ) : (
              <Circle className="h-5 w-5 text-pink-300 hover:text-pink-500" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold text-sm ${
                todo.completed ? "text-muted-foreground line-through" : "text-foreground"
              }`}
            >
              {todo.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <Badge className={`text-xs font-medium border ${priorityStyles[todo.priority]}`}>
                <Flag className="mr-1 h-3 w-3" />
                {todo.priority}
              </Badge>
              <Badge className={`text-xs font-medium border ${categoryStyle.bg} ${categoryStyle.color}`}>
                <Tag className="mr-1 h-3 w-3" />
                {todo.category}
              </Badge>
              {todo.dueDate && (
                <span
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    isOverdue ? "text-red-600" : "text-muted-foreground"
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  {formatDate(todo.dueDate)}
                  {isOverdue && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-600">Overdue</span>
                  )}
                </span>
              )}

              {/* Subtask count */}
              {totalSubtasks > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ListTodo className="h-3 w-3" />
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}

              {/* Add Image Button (hidden, shown on hover) */}
              {!todo.imageUrl && (
                <label className="flex items-center gap-1 text-xs text-muted-foreground/60 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-pink-500 transition-all">
                  <ImagePlus className="h-3 w-3" />
                  <span>Add image</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
          <button
            onClick={() => onDelete(todo.id)}
            className="flex-shrink-0 rounded-lg p-1 text-muted-foreground opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
      </div>
      
      {/* Subtasks */}
      {(todo.subtasks.length > 0 || showSubtaskInput) && (
        <div className="px-4 pb-3">
          <div className="ml-6 space-y-1.5 border-l-2 border-pink-100 pl-3">
            {todo.subtasks.map((subtask) => (
              <div key={subtask.id} className="group/subtask flex items-center gap-2">
                <button
                  onClick={() => onToggleSubtask(todo.id, subtask.id)}
                  className="flex-shrink-0 text-muted-foreground hover:text-pink-500 transition-colors"
                >
                  {subtask.completed ? (
                    <CheckSquare className="h-4 w-4 text-pink-500" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <span className={`flex-1 text-xs ${subtask.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {subtask.title}
                </span>
                <button
                  onClick={() => onDeleteSubtask(todo.id, subtask.id)}
                  className="flex-shrink-0 text-muted-foreground/40 opacity-0 group-hover/subtask:opacity-100 hover:text-red-500 transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            {/* Add subtask input */}
            {showSubtaskInput && (
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Add item..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSubtask();
                    if (e.key === "Escape") {
                      setShowSubtaskInput(false);
                      setNewSubtaskTitle("");
                    }
                  }}
                  autoFocus
                  className="flex-1 bg-transparent text-sm border-none outline-none placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={() => {
                    setShowSubtaskInput(false);
                    setNewSubtaskTitle("");
                  }}
                  className="text-muted-foreground/40 hover:text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add subtask button */}
      <div className="mt-auto px-4 pb-3">
        <button
          onClick={() => setShowSubtaskInput(true)}
          className={`ml-6 flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-pink-500 transition-colors ${showSubtaskInput ? "hidden" : ""}`}
        >
          <Plus className="h-3 w-3" />
          <span>Add checklist item</span>
        </button>
      </div>

      {/* Task Image */}
      {todo.imageUrl && (
        <div className="relative px-4 pb-4">
          <div className="relative inline-block ml-6">
            <img
              src={todo.imageUrl}
              alt="Task attachment"
              className="h-32 w-auto rounded-xl object-cover border border-pink-100 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onExpandImage(todo.imageUrl!)}
            />
            <button
              onClick={() => onRemoveImage(todo.id)}
              className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
