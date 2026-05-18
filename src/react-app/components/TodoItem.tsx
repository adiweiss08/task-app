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
import { formatDisplayDate, parseLocalDate } from "@/react-app/lib/dates";
import type { Priority, Todo } from "@/react-app/types/todo";
import { getCategoryStyle } from "@/react-app/types/todo";

export interface TodoItemProps {
  todo: Todo;
  viewMode?: "grid" | "list";
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
  const d = parseLocalDate(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.getTime() === now.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  return formatDisplayDate(dateStr);
}

export function TodoItem({
  todo,
  viewMode = "grid",
  onToggle,
  onDelete,
  onRemoveImage,
  onAddImage,
  onExpandImage,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TodoItemProps) {
  const isList = viewMode === "list";
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
  const dueDateObj = todo.dueDate ? parseLocalDate(todo.dueDate) : null;
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

  const cardHeight = isList ? "h-40" : "h-56";
  const cardWidth = isList ? "w-52 max-w-full mx-auto" : "w-full";
  const imageSize = isList ? "h-24 w-24" : "h-20 w-20";
  const headerHeight = isList ? "h-[5.5rem]" : "h-[5.75rem]";
  const titleClass = isList ? "line-clamp-2 text-sm font-semibold" : "line-clamp-2 text-base font-semibold";

  return (
    <div
      className={`group flex ${cardHeight} ${cardWidth} flex-col overflow-hidden rounded-xl border bg-white ${categoryStyle.bg.replace("bg-", "border-").replace("-100", "-200")} ${todo.completed ? "opacity-60" : ""}`}
    >
      <div className="flex h-full min-h-0 flex-col p-3.5">
        <div className={`flex ${headerHeight} flex-shrink-0 items-start gap-2`}>
          <button type="button" onClick={() => onToggle(todo.id)} className="mt-0.5 flex-shrink-0">
            {todo.completed ? (
              <CheckCircle2 className="h-5 w-5 text-pink-500" />
            ) : (
              <Circle className="h-5 w-5 text-pink-300 hover:text-pink-500" />
            )}
          </button>

          <div className="flex min-h-0 min-w-0 flex-1 items-start gap-2.5">
            <div className="min-h-0 min-w-0 flex-1">
              <p
                className={`${titleClass} leading-snug ${todo.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {todo.title}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge className={`h-5 px-1.5 py-0 text-[10px] font-medium border ${priorityStyles[todo.priority]}`}>
                  <Flag className="mr-0.5 h-2.5 w-2.5" />
                  {todo.priority}
                </Badge>
                <Badge className={`h-5 px-1.5 py-0 text-[10px] font-medium border ${categoryStyle.bg} ${categoryStyle.color}`}>
                  <Tag className="mr-0.5 h-2.5 w-2.5" />
                  {todo.category}
                </Badge>
                {todo.dueDate && (
                  <span
                    className={`flex items-center gap-0.5 text-[10px] font-medium ${isOverdue ? "text-red-600" : "text-muted-foreground"}`}
                  >
                    <Clock className="h-3 w-3" />
                    {formatDueLabel(todo.dueDate)}
                  </span>
                )}
                {totalSubtasks > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <ListTodo className="h-3 w-3" />
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                )}
              </div>
            </div>

            <div className={`${imageSize} flex-shrink-0`}>
              {todo.imageUrl ? (
                <div className={`relative ${imageSize}`}>
                  <img
                    src={todo.imageUrl}
                    alt="Task attachment"
                    className={`${imageSize} cursor-pointer rounded-lg border border-pink-100 object-cover`}
                    onClick={() => onExpandImage(todo.imageUrl!)}
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(todo.id)}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <label
                  className={`flex ${imageSize} cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-pink-200 bg-pink-50/40 text-[9px] text-muted-foreground/70 opacity-0 transition-opacity hover:text-pink-500 group-hover:opacity-100`}
                >
                  <ImagePlus className="mb-0.5 h-4 w-4" />
                  <span>Image</span>
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
            className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-pink-50 pt-2 pl-7">
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
            <div className="flex items-center gap-1 py-0.5">
              <Square className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40" />
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
                className="min-w-0 flex-1 border-none bg-transparent text-xs outline-none"
              />
              <button type="button" onClick={handleAddSubtask} className="text-[10px] font-bold text-pink-500">
                SAVE
              </button>
            </div>
          )}
          {!showSubtaskInput && (
            <button
              type="button"
              onClick={() => setShowSubtaskInput(true)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-pink-500"
            >
              <Plus className="h-3 w-3" />
              Checklist
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

