import { db } from "@/db/client";
import { taskTemplates } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

type TemplateRow = {
  id: string;
  industry: string;
  type: string;
  title: string;
};

export const metadata = {
  title: "Templates | GEO Command Center",
};

export default async function AdminTemplatesPage() {
  const session = await getSessionContext();

  if (!session) {
    return null;
  }

  const rows = await db.select().from(taskTemplates).limit(100);

  const data: TemplateRow[] = rows.map((t) => ({
    id: t.id,
    industry: t.industry,
    type: t.type,
    title: t.title,
  }));

  const columns: ColumnDef<TemplateRow>[] = [
    {
      accessorKey: "title",
      header: "Template",
    },
    {
      accessorKey: "industry",
      header: "Industry",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Task and report templates for GEO programs by industry.
        </p>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}

