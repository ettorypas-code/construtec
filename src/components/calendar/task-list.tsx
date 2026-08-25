"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Trash2, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDate, isOverdue, relativeDayLabel } from "@/lib/utils/dates";
import { taskPriorityLabels, taskPriorityTones } from "@/domain/labels";
import type { TaskPriority } from "@/domain/enums";
import { deleteTaskAction, toggleTaskAction } from "@/app/(app)/agenda/actions";

export type TaskListItem = {
  id: string;
  title: string;
  detail: string | null;
  dueAt: Date | null;
  done: boolean;
  priority: string;
  source: string;
  link: string | null;
};

export function TaskList({ tasks }: { tasks: TaskListItem[] }) {
  return (
    <ul className="divide-y divide-ink-100">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </ul>
  );
}

function TaskRow({ task }: { task: TaskListItem }) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(task.done);

  const overdue = !done && isOverdue(task.dueAt);

  return (
    <li className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <button
        type="button"
        aria-label={done ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
        onClick={() =>
          startTransition(async () => {
            setDone(!done);
            const result = await toggleTaskAction({ id: task.id, done: !done });
            if (!result.ok) toast(result.error, "error");
            else router.refresh();
          })
        }
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
          done
            ? "border-success bg-success text-white"
            : "border-ink-300 bg-surface hover:border-brand-500",
        )}
      >
        {done ? <Check className="size-3.5" /> : null}
      </button>

      <div className="min-w-0 flex-1">
        {task.link ? (
          <Link
            href={task.link}
            className={cn(
              "text-sm font-medium transition-colors hover:text-brand-700",
              done ? "text-ink-400 line-through" : "text-ink-900",
            )}
          >
            {task.title}
          </Link>
        ) : (
          <p
            className={cn(
              "text-sm font-medium",
              done ? "text-ink-400 line-through" : "text-ink-900",
            )}
          >
            {task.title}
          </p>
        )}

        {task.detail ? <p className="mt-0.5 text-xs text-ink-500">{task.detail}</p> : null}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {task.dueAt ? (
            <span className={cn("text-xs", overdue ? "font-medium text-danger" : "text-ink-500")}>
              {overdue ? "Venceu " : ""}
              {relativeDayLabel(task.dueAt)} · {formatDate(task.dueAt)}
            </span>
          ) : null}
          {task.priority === "ALTA" && !done ? (
            <Badge tone={taskPriorityTones[task.priority as TaskPriority]}>
              {taskPriorityLabels[task.priority as TaskPriority]}
            </Badge>
          ) : null}
          {task.source === "AUTOMACAO" ? (
            <span
              className="inline-flex items-center gap-1 text-xs text-ink-400"
              title="Criada por automação"
            >
              <Zap className="size-3" />
              automática
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        aria-label={`Remover ${task.title}`}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteTaskAction({ id: task.id });
            if (result.ok) router.refresh();
            else toast(result.error, "error");
          })
        }
        className="-m-1 shrink-0 rounded p-1 text-ink-300 transition-colors hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}
