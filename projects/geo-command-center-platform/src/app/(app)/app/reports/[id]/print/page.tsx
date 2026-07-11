import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { deliverables } from "@/db/schema";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ReportPrintPage({ params }: Props) {
  const { id } = await params;
  const report = await db
    .select()
    .from(deliverables)
    .where(eq(deliverables.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!report || report.type !== "monthly_report") {
    notFound();
  }

  const content = (report.contentJson ?? {}) as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8 print:p-0">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-semibold">{report.title}</h1>
        <p className="text-sm text-muted-foreground">
          GEO Command Center monthly report print view
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Executive Summary</h2>
        <p className="text-sm leading-6">
          {String(content.executiveSummary ?? "No summary generated.")}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Visibility</h2>
        <pre className="rounded border bg-muted/30 p-3 text-xs">
          {JSON.stringify(content.visibility ?? {}, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Work Completed</h2>
        <pre className="rounded border bg-muted/30 p-3 text-xs">
          {JSON.stringify(content.workCompleted ?? {}, null, 2)}
        </pre>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Enterprise GEO Audit Snapshot</h2>
        <pre className="rounded border bg-muted/30 p-3 text-xs">
          {JSON.stringify(content.enterpriseAudit ?? {}, null, 2)}
        </pre>
      </section>
    </div>
  );
}

