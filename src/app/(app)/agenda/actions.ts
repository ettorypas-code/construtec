"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formAction, objectAction } from "@/lib/actions/action";
import { requiredId } from "@/lib/validation/common";
import {
  calendarEventSchema,
  taskSchema,
  taskToggleSchema,
} from "@/lib/validation/calendar";
import {
  createEvent,
  createTask,
  deleteEvent,
  deleteTask,
  toggleTask,
} from "@/lib/services/calendar";

export const createEventAction = formAction({
  schema: calendarEventSchema,
  successMessage: "Compromisso agendado.",
  handler: async (input, { user }) => {
    const event = await createEvent(input, user.id);
    revalidatePath("/agenda");
    revalidatePath("/dashboard");
    return { id: event.id };
  },
});

export const deleteEventAction = objectAction({
  schema: z.object({ id: requiredId }),
  handler: async ({ id }) => {
    await deleteEvent(id);
    revalidatePath("/agenda");
    revalidatePath("/dashboard");
    return { id };
  },
});

export const createTaskAction = formAction({
  schema: taskSchema,
  successMessage: "Tarefa criada.",
  handler: async (input, { user }) => {
    const task = await createTask(input, user.id);
    revalidatePath("/agenda");
    revalidatePath("/dashboard");
    return { id: task.id };
  },
});

export const toggleTaskAction = objectAction({
  schema: taskToggleSchema,
  handler: async ({ id, done }) => {
    await toggleTask(id, done);
    revalidatePath("/agenda");
    revalidatePath("/dashboard");
    return { id, done };
  },
});

export const deleteTaskAction = objectAction({
  schema: z.object({ id: requiredId }),
  handler: async ({ id }) => {
    await deleteTask(id);
    revalidatePath("/agenda");
    return { id };
  },
});
