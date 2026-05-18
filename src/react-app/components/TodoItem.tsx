import { useState, useRef, type ChangeEvent } from "react";
import {
  Plus,
  Flag,
  CheckCircle2,
  Circle,
  X,
  Tag,
  Clock,
  ImagePlus,
  Trash2,
  ListTodo,
  Square,
} from "lucide-react";
import { Badge } from "@/react-app/components/ui/badge";
import { SubtaskItem } from "@/react-app/components/SubtaskItem";
import type { Priority, Todo } from "@/react-app/types/todo";
import { getCategoryStyle } from "@/react-app/types/todo";

export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onRemoveImage: (id: number) => void;
  onAddImage: (id: number, imageUrl: string) => void;
  onExpandImage: (imageUrl: string) => void;
  onAddSubtask: (todoId: number, title: string) => void;
  onToggleSubtask: (todoId: number, subtaskId: number | string) => void;
  onDeleteSubtask: (todoId: number, subtaskId: number) => void;
}

const priorityStyles: Record<Priority, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

function formatDueLabel(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.getTime() === now.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TodoItem({
  todo,
  onToggle,
  onDelete,
  onRemoveImage,
  onAddImage,
  onExpandImage,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TodoItemProps) {
  const categoryStyle = getCategoryStyle(todo.category);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);

  const completedSubtasks = todo.subtasks.filter((st) => st.completed).length;
  const totalSubtasks = todo.subtasks.length;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    onAddSubtask(todo.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
    setShowSubtaskInput(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateObj = todo.dueDate ? new Date(todo.dueDate) : null;
  if (dueDateObj) dueDateObj.setHours(0, 0, 0, 0);
  const isOverdue = Boolean(dueDateObj && dueDateObj < today && !todo.completed);

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>, todoId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAddImage(todoId, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`group h-full rounded-2xl border bg-white transition-all hover:-translate-y-1 hover:shadow-lg ${categoryStyle.bg.replace("bg-", "border-").replace("-100", "-200")} ${todo.completed ? "opacity-60" : ""}`}
    >
      <div className="flex h-full flex-col p-4">
        <div className="flex items-start gap-2">
          <button
            type="button"
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
              className={`font-semibold text-sm ${todo.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
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
                  className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}
                >
                  <Clock className="h-3 w-3" />
                  <span>{formatDueLabel(todo.dueDate)}</span>
                  {isOverdue && (
                    <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600">
                      Overdue
                    </span>
                  )}
                </span>
              )}
              {totalSubtasks > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ListTodo className="h-3 w-3" />
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}
              {!todo.imageUrl && (
                <label className="flex items-center gap-1 text-xs text-muted-foreground/60 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-pink-500 transition-all">
                  <ImagePlus className="h-3 w-3" />
                  <span>Add image</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, todo.id)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDelete(todo.id)}
            className="flex-shrink-0 rounded-lg p-1 text-muted-foreground opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {(todo.subtasks.length > 0 || showSubtaskInput) && (
          <div className="px-4 pb-3">
            <div className="ml-6 space-y-1.5 border-l-2 border-pink-100 pl-3">
              {todo.subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  todoId={todo.id}
                  onToggle={onToggleSubtask}
                  onDelete={onDeleteSubtask}
                />
              ))}
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
                    type="button"
                    onClick={handleAddSubtask}
                    className="text-xs font-bold text-pink-500 hover:text-pink-700 px-2"
                  >
                    SAVE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubtaskInput(false);
                      setNewSubtaskTitle("");
                    }}
                    className="text-muted-foreground/40 hover:text-muted-foreground p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto px-4 pb-3">
          <button
            type="button"
            onClick={() => setShowSubtaskInput(true)}
            className={`ml-6 flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-pink-500 transition-colors ${showSubtaskInput ? "hidden" : ""}`}
          >
            <Plus className="h-3 w-3" />
            <span>Add checklist item</span>
          </button>
        </div>

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
                type="button"
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
