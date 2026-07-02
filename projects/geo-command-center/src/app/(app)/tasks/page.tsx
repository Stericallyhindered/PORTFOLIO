"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { TaskKanbanBoard, type TaskItem } from "@/components/tasks/TaskKanbanBoard";
import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

type TaskRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string | null;
  kind?: "recommendation" | "pipeline";
  runStatus?: string;
  progress?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  failureSummary?: string | null;
};

export default function TasksPage() {
  const [data, setData] = React.useState<TaskRow[]>([]);
  const [activeProjectId, setActiveProjectId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<"kanban" | "table">("kanban");

  const refresh = React.useCallback(async () => {
    const path = activeProjectId
      ? `/tasks?project_id=${encodeURIComponent(activeProjectId)}`
      : "/tasks";
    const body = await fastapiFetch<TaskRow[]>(path);
    setData(body);
  }, [activeProjectId]);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/context/active-client", { cache: "no-store" }).then(
        (r) => (r.ok ? r.json() : { clientId: null }),
      );
      setActiveProjectId(typeof res.clientId === "string" ? res.clientId : null);
    })();
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function moveTask(taskId: string, status: TaskItem["status"]) {
    if (taskId.startsWith("pipeline:")) return;
    await fastapiFetch(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await refresh();
  }

  async function deleteTask(taskId: string) {
    const isPipeline = taskId.startsWith("pipeline:");
    const confirmed = window.confirm(
      isPipeline
        ? "Remove this pipeline run? If still running, it will be stopped."
        : "Delete this task?",
    );
    if (!confirmed) return;
    await fastapiFetch(`/tasks/${taskId}`, {
      method: "DELETE",
    });
    await refresh();
  }

  const columns: ColumnDef<TaskRow>[] = [
    {
      accessorKey: "title",
      header: "Task",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row, getValue }) => {
        const runStatus = row.original.runStatus;
        return (
          <Badge variant="outline" className="uppercase">
            {runStatus ?? getValue<string>()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ getValue }) => getValue<string | null>() ?? "—",
    },
    {
      accessorKey: "failureSummary",
      header: "Failure Details",
      cell: ({ getValue }) => getValue<string | null>() ?? "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const isPipeline = row.original.id.startsWith("pipeline:");
        return (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600"
            onClick={() => deleteTask(row.original.id)}
          >
            {isPipeline ? "Kill/Remove" : "Delete"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage GEO task delivery plus live audit pipeline runs (auto-refresh every 5s).
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "kanban" ? "default" : "outline"}
            onClick={() => setView("kanban")}
          >
            Kanban
          </Button>
          <Button
            size="sm"
            variant={view === "table" ? "default" : "outline"}
            onClick={() => setView("table")}
          >
            Table
          </Button>
        </div>
      </div>
      {view === "kanban" ? (
        <TaskKanbanBoard
          tasks={data as TaskItem[]}
          onMove={moveTask}
          onDelete={deleteTask}
        />
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}

