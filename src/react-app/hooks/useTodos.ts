import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/react-app/lib/api";
import type { Todo, Subtask, Priority } from "@/react-app/types/todo";
import { mapApiTodoToUi } from "@/react-app/types/todo";

export interface AddTodoPayload {
  title: string;
  category: string;
  priority: Priority;
  dueDate: string;
  imageBase64: string | null;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const todosRef = useRef<Todo[]>([]);
  todosRef.current = todos;

  // עדכון: הוספת תמיכה בפרמטר includeArchived
  const refetchTodos = useCallback(async (includeArchived?: boolean) => {
    try {
      const url = includeArchived ? "/api/todos?include_archived=true" : "/api/todos";
      
      const res = await apiFetch(url, {
        method: "GET",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as Record<string, unknown>[];
      setTodos(data.map(mapApiTodoToUi));
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  }, []);

  // ברירת המחדל בטעינה ראשונית (למשל בדף הבית) היא להביא רק משימות פעילות
  useEffect(() => {
    void refetchTodos();
  }, [refetchTodos]);

  const toggleTodo = useCallback(
    async (id: number) => {
      const todo = todosRef.current.find((t) => t.id === id);
      if (!todo) return;
      const nextCompleted = !todo.completed;
      const isCompletedDb = nextCompleted ? 1 : 0;

      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
      );

      try {
        const res = await apiFetch(`/api/todos/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_completed: isCompletedDb }),
          cache: "no-store",
        });
        if (!res.ok) {
          await refetchTodos();
          return;
        }
        await refetchTodos();
      } catch (err) {
        console.error("Toggle error:", err);
        await refetchTodos();
      }
    },
    [refetchTodos]
  );

  const addTodo = useCallback(
    async (payload: AddTodoPayload) => {
      const trimmed = payload.title.trim();
      if (!trimmed) return false;
      try {
        const res = await apiFetch("/api/todos", {
          method: "POST",
          body: JSON.stringify({
            title: trimmed,
            subtasks: [],
            category: payload.category,
            priority: payload.priority,
            due_date: payload.dueDate,
            image_url: payload.imageBase64,
          }),
          cache: "no-store",
        });
        if (res.ok) {
          await refetchTodos();
          return true;
        }
      } catch (err) {
        console.error("Error adding todo:", err);
      }
      return false;
    },
    [refetchTodos]
  );

  const deleteTodo = useCallback(
    async (id: number) => {
      try {
        setTodos((prev) => prev.filter((t) => t.id !== id));
        const res = await apiFetch(`/api/todos/${id}`, {
          method: "DELETE",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) {
          console.error("Server failed to delete");
          await refetchTodos();
        }
      } catch (err) {
        console.error("Delete error:", err);
        await refetchTodos();
      }
    },
    [refetchTodos]
  );

  const removeImageFromTodo = useCallback(
    async (id: number) => {
      try {
        const res = await apiFetch(`/api/todos/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ image_url: null }),
          cache: "no-store",
        });
        if (res.ok) {
          setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, imageUrl: null } : t)));
          await refetchTodos();
        }
      } catch (err) {
        console.error("Remove image error:", err);
      }
    },
    [refetchTodos]
  );

  const addImageToTodo = useCallback(
    async (id: number, imageDataUrl: string) => {
      try {
        const res = await apiFetch(`/api/todos/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ image_url: imageDataUrl }),
          cache: "no-store",
        });
        if (res.ok) {
          setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, imageUrl: imageDataUrl } : t)));
          await refetchTodos();
        }
      } catch (err) {
        console.error("Add image error:", err);
      }
    },
    [refetchTodos]
  );

  const addSubtask = useCallback(
    async (todoId: number, title: string) => {
      try {
        const targetTodo = todosRef.current.find((t) => t.id === todoId);
        if (!targetTodo) return;
        const newSub: Subtask = { id: Date.now(), title, completed: false };
        const updatedSubtasks = [...(targetTodo.subtasks || []), newSub];
        const res = await apiFetch(`/api/todos/${todoId}`, {
          method: "PATCH",
          body: JSON.stringify({ subtasks: updatedSubtasks }),
          cache: "no-store",
        });
        if (res.ok) {
          setTodos((prev) =>
            prev.map((t) => (t.id === todoId ? { ...t, subtasks: updatedSubtasks } : t))
          );
          await refetchTodos();
        }
      } catch (err) {
        console.error("Add subtask error:", err);
      }
    },
    [refetchTodos]
  );

  const toggleSubtask = useCallback(
    async (todoId: number, subtaskId: number | string) => {
      setTodos((prevTodos) =>
        prevTodos.map((todo) => {
          if (todo.id !== todoId) return todo;
          const newSubtasks = todo.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...todo, subtasks: newSubtasks };
        })
      );
      try {
        const todo = todosRef.current.find((t) => t.id === todoId);
        if (!todo) return;
        const updatedSubtasks = todo.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        await apiFetch(`/api/todos/${todoId}`, {
          method: "PATCH",
          body: JSON.stringify({ subtasks: updatedSubtasks }),
        });
      } catch (err) {
        console.error("Update failed", err);
        await refetchTodos();
      }
    },
    [refetchTodos]
  );

  const deleteSubtask = useCallback(
    async (todoId: number, subtaskId: number) => {
      const targetTodo = todosRef.current.find((t) => t.id === todoId);
      if (!targetTodo) return;
      const updatedSubtasks = targetTodo.subtasks.filter((st) => st.id !== subtaskId);
      try {
        const res = await apiFetch(`/api/todos/${todoId}`, {
          method: "PATCH",
          body: JSON.stringify({ subtasks: updatedSubtasks }),
          cache: "no-store",
        });
        if (res.ok) {
          setTodos((prev) =>
            prev.map((t) => (t.id === todoId ? { ...t, subtasks: updatedSubtasks } : t))
          );
          await refetchTodos();
        }
      } catch (err) {
        console.error("Delete subtask error:", err);
      }
    },
    [refetchTodos]
  );

  const clearCompleted = useCallback(() => {
    const completedIds = todosRef.current.filter((t) => t.completed).map((t) => t.id);
    completedIds.forEach((id) => {
      void deleteTodo(id);
    });
  }, [deleteTodo]);

  return {
    todos,
    refetchTodos,
    toggleTodo,
    addTodo,
    deleteTodo,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    removeImageFromTodo,
    addImageToTodo,
    clearCompleted,
  };
}