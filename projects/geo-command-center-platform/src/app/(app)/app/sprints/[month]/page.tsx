import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { getSessionContext } from "@/lib/auth/session";
import { fastapiFetch } from "@/lib/fastapiClient";

type Props = {
  params: Promise<{
    month: string;
  }>;
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  type: string;
};

export default async function SprintMonthPage({ params }: Props) {
  const { month } = await params;
  const session = await getSessionContext();
  const backendOverview =
    session?.currentOrgId == null
      ? null
      : await fastapiFetch<{
          tasks: Array<{ id: string; title: string; type: string; status: string }>;
        }>("/reports/org-overview", undefined, session.currentOrgId).catch(() => null);

  const columns: ColumnDef<TaskRow>[] = [
    { accessorKey: "title", header: "Task" },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "status", header: "Status" },
  ];

  const data: TaskRow[] = backendOverview?.tasks ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sprint {month}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {data.length > 0
            ? `Status: active (${data.length} tasks)`
            : "No sprint tasks available yet."}
        </CardContent>
      </Card>
      <DataTable columns={columns} data={data} />
    </div>
  );
}

