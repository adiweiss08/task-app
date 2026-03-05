import z from "zod";

export const PrioritySchema = z.enum(["low", "medium", "high"]);
export const CategorySchema = z.enum(["work", "personal", "health", "shopping", "other"]);

export const SubtaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
});

export const TodoSchema = z.object({
  id: z.number(),
  title: z.string(),
  is_completed: z.number().int(), // 0 or 1 in the DB
  priority: PrioritySchema,
  category: CategorySchema,
  due_date: z.string().nullable(),
  image_url: z.string().nullable(),
  subtasks: z.array(SubtaskSchema).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateTodoSchema = z.object({
  title: z.string().min(1),
  priority: PrioritySchema,
  category: CategorySchema,
  due_date: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  subtasks: z.array(SubtaskSchema).optional(),
});

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  is_completed: z.number().int().min(0).max(1).optional(),
  priority: PrioritySchema.optional(),
  category: CategorySchema.optional(),
  due_date: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  subtasks: z.array(SubtaskSchema).optional(),
});

export const BirthdaySchema = z.object({
  id: z.number(),
  name: z.string(),
  date: z.string(),
});

export const CreateBirthdaySchema = z.object({
  name: z.string().min(1),
  date: z.string(),
});

export type Priority = z.infer<typeof PrioritySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodo = z.infer<typeof CreateTodoSchema>;
export type UpdateTodo = z.infer<typeof UpdateTodoSchema>;
export type Birthday = z.infer<typeof BirthdaySchema>;
export type CreateBirthday = z.infer<typeof CreateBirthdaySchema>;
