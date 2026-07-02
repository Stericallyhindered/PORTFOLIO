import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppHomePage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Welcome to GEO Command Center</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This is your command console for Generative Engine Optimization
            across clients, AI engines, and monthly GEO programs.
          </p>
          <p>
            Use the navigation on the left to jump into dashboards, visibility,
            content audits, entities, tasks, and reports.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Client Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            See AI visibility snapshots, active sprints, and approvals waiting
            for review.
          </p>
          <Link
            href="/app/dashboard"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Go to dashboard
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Track mentions, citations, and share-of-voice by engine and query
            over time.
          </p>
          <Link
            href="/app/visibility"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View visibility
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tasks & Sprints</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Manage GEO sprints, Kanban workflows, approvals, and SLAs.
          </p>
          <Link
            href="/app/tasks"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open task board
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

