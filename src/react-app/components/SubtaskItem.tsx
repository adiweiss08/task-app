import { CheckSquare, Square, X } from "lucide-react";
import type { Subtask } from "@/react-app/types/todo";

interface SubtaskItemProps {
  subtask: Subtask;
  todoId: number;
  onToggle: (todoId: number, subtaskId: number | string) => void;
  onDelete: (todoId: number, subtaskId: number) => void;
}

export function SubtaskItem({ subtask, todoId, onToggle, onDelete }: SubtaskItemProps) {
  return (
    <div className="group/subtask flex items-center gap-2">
      <button
        type="button"
        onClick={() => onToggle(todoId, subtask.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-pink-500 transition-colors"
      >
        {subtask.completed ? (
          <CheckSquare className="h-4 w-4 text-pink-500" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>
      <span
        className={`flex-1 text-xs ${subtask.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
      >
        {subtask.title}
      </span>
      <button
        type="button"
        onClick={() => onDelete(todoId, subtask.id)}
        className="flex-shrink-0 text-muted-foreground/40 opacity-0 group-hover/subtask:opacity-100 hover:text-red-500 transition-all"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
