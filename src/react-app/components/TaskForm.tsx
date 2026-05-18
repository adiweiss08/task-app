import type { Dispatch, RefObject, SetStateAction } from "react";
import { Plus, Tag, Flag, Calendar, ImagePlus, X } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import type { Category, CategoryOption, Priority } from "@/react-app/types/todo";
import { PRIORITY_OPTIONS } from "@/react-app/types/todo";

interface TaskFormProps {
  newTask: string;
  setNewTask: (value: string) => void;
  newCategory: Category;
  setNewCategory: (value: Category) => void;
  newPriority: Priority;
  setNewPriority: (value: Priority) => void;
  newDueDate: string;
  setNewDueDate: (value: string) => void;
  newImage: string | null;
  setNewImage: (value: string | null) => void;
  categories: CategoryOption[];
  setCategories: Dispatch<SetStateAction<CategoryOption[]>>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSubmit: () => void;
  onCancel: () => void;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TaskForm({
  newTask,
  setNewTask,
  newCategory,
  setNewCategory,
  newPriority,
  setNewPriority,
  newDueDate,
  setNewDueDate,
  newImage,
  setNewImage,
  categories,
  setCategories,
  fileInputRef,
  onSubmit,
  onCancel,
  onImageSelect,
}: TaskFormProps) {
  return (
    <div className="mb-6 rounded-2xl border border-pink-200 bg-white p-5 shadow-lg">
      <Input
        placeholder="What needs to be done?"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && newTask.trim() && onSubmit()}
        autoFocus
        className="mb-4 border-0 bg-transparent px-0 text-lg font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0"
      />
      {newImage && (
        <div className="mb-4 relative inline-block">
          <img
            src={newImage}
            alt="Task preview"
            className="h-24 w-auto rounded-lg object-cover border border-pink-200"
          />
          <button
            type="button"
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
              const value = e.target.value as Category | "__new__";
              if (value === "__new__") {
                const label = window.prompt("New type name (for example: School, Hobby)");
                if (label && label.trim()) {
                  const trimmed = label.trim();
                  const slug = trimmed.toLowerCase().replace(/\s+/g, "-");
                  const newCat: CategoryOption = {
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
            {PRIORITY_OPTIONS.map((p) => (
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
        <label className="flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50/50 px-3 py-1.5 text-sm cursor-pointer hover:bg-pink-100/50 transition-colors">
          <ImagePlus className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Image</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageSelect}
            className="hidden"
          />
        </label>
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => {
              onCancel();
              setNewImage(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={!newTask.trim()}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
          >
            Add Task
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AddTaskTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-pink-200 bg-white/50 px-5 py-5 text-left text-muted-foreground transition-all hover:border-pink-400 hover:bg-white/80 hover:shadow-sm group"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-sm group-hover:shadow-md transition-shadow">
        <Plus className="h-5 w-5" />
      </div>
      <span className="font-medium">Add a new task...</span>
    </button>
  );
}
