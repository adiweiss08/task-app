import z from "zod";

export const PrioritySchema = z.enum(["low", "medium", "high"]);
export const CategorySchema = z.enum(["work", "personal", "health", "shopping", "other"]);

export const TodoSchema = z.object({
  id: z.number(),
  title: z.string(),
  is_completed: z.number().int(), // 0 or 1
  priority: PrioritySchema,
  category: CategorySchema,
  due_date: z.string().nullable(),
  image_key: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateTodoSchema = z.object({
  title: z.string().min(1),
  priority: PrioritySchema,
  category: CategorySchema,
  due_date: z.string().nullable().optional(),
});

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  is_completed: z.number().int().min(0).max(1).optional(),
  priority: PrioritySchema.optional(),
  category: CategorySchema.optional(),
  due_date: z.string().nullable().optional(),
});

export type Priority = z.infer<typeof PrioritySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodo = z.infer<typeof CreateTodoSchema>;
export type UpdateTodo = z.infer<typeof UpdateTodoSchema>;
