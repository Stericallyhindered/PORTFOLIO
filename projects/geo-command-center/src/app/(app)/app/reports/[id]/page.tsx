import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { deliverables } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalActions } from "@/components/approvals/ApprovalActions";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;

  const report = await db
    .select()
    .from(deliverables)
    .where(eq(deliverables.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!report) {
    notFound();
  }

  if (report.type === "schema_update") {
    const content = (report.contentJson ?? {}) as Record<string, unknown>;
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{report.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {report.description ?? "GEO implementation package."}
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm">
                <Link href={`/api/geo-packages/${report.id}/download`}>
                  Download JSON Package
                </Link>
              </Button>
            </div>
            <pre className="max-h-[500px] overflow-auto rounded border bg-muted/30 p-3 text-xs">
              {JSON.stringify(content, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (report.type === "content_piece") {
    const content = (report.contentJson ?? {}) as Record<string, unknown>;
    const kind = String(content.kind ?? "");
    if (kind === "geo_page_prompt_pack") {
      const prompts = Array.isArray(content.prompts)
        ? (content.prompts as Array<Record<string, unknown>>)
        : [];
      const excludedPages = Array.isArray(content.excludedPages)
        ? (content.excludedPages as Array<Record<string, unknown>>)
        : [];
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {report.description ?? "GEO page prompt pack."}
              </p>
              <div className="grid gap-2 text-xs md:grid-cols-3">
                <p>Version: {String(content.version ?? "1")}</p>
                <p>Prompts: {String(content.pagePromptCount ?? prompts.length)}</p>
                <p>Excluded pages: {excludedPages.length}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link href={`/api/prompt-packs/${report.id}/download`}>
                    Download Prompt Pack JSON
                  </Link>
                </Button>
              </div>
              {prompts[0] && (
                <pre className="max-h-[280px] overflow-auto rounded border bg-muted/30 p-3 text-xs">
                  {JSON.stringify(prompts[0], null, 2)}
                </pre>
              )}
              <pre className="max-h-[500px] overflow-auto rounded border bg-muted/30 p-3 text-xs">
                {JSON.stringify(content, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{report.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            {report.description ?? "Monthly GEO report detail view."}
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href={`/api/reports/${report.id}/download`}>Download PDF</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/app/reports/${report.id}/print`}>Print View</Link>
            </Button>
          </div>
          <ApprovalActions deliverableId={report.id} />
        </CardContent>
      </Card>
    </div>
  );
}

