"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type TaskItem = {
  id: string;
  title: string;
  type: string;
  status: "backlog" | "in_progress" | "in_review" | "blocked" | "done";
  priority: string | null;
  kind?: "recommendation" | "pipeline";
  runStatus?: string;
  progress?: number | null;
  failureSummary?: string | null;
};

const columns: Array<TaskItem["status"]> = [
  "backlog",
  "in_progress",
  "in_review",
  "blocked",
  "done",
];

export function TaskKanbanBoard({
  tasks,
  onMove,
  onDelete,
}: {
  tasks: TaskItem[];
  onMove: (taskId: string, status: TaskItem["status"]) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}) {
  const grouped = useMemo(() => {
    const map = new Map<TaskItem["status"], TaskItem[]>();
    columns.forEach((column) => map.set(column, []));
    tasks.forEach((task) => {
      map.get(task.status)?.push(task);
    });
    return map;
  }, [tasks]);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {columns.map((column) => (
        <Card key={column} className="min-h-[280px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm uppercase">
              {column.replace("_", " ")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(grouped.get(column) ?? []).map((task) => (
              <div key={task.id} className="rounded border bg-card p-2 text-xs">
                <div className="mb-1 font-medium">{task.title}</div>
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="outline">{task.type}</Badge>
                  <span className="text-muted-foreground">
                    {task.priority ?? "—"}
                  </span>
                </div>
                {task.kind === "pipeline" ? (
                  <div className="mb-2 space-y-1 text-[10px] text-muted-foreground">
                    <p>
                      {task.runStatus ?? "running"} · progress{" "}
                      {Math.round((task.progress ?? 0) * 100)}%
                    </p>
                    {task.failureSummary ? <p className="text-destructive">{task.failureSummary}</p> : null}
                  </div>
                ) : null}
                <div className="flex gap-1">
                  {task.kind !== "pipeline"
                    ? columns
                        .filter((next) => next !== column)
                        .slice(0, 2)
                        .map((next) => (
                          <Button
                            key={next}
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1 text-[10px]"
                            onClick={() => onMove(task.id, next)}
                          >
                            {next.replace("_", " ")}
                          </Button>
                        ))
                    : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1 text-[10px] text-red-600"
                    onClick={() => onDelete(task.id)}
                  >
                    {task.kind === "pipeline" ? "kill/remove" : "delete"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

