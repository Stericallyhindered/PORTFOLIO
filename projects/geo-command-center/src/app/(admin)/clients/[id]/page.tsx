import { notFound } from "next/navigation";

import { db } from "@/db/client";
import {
  clients,
  integrations,
  brandEntities,
  competitorEntities,
} from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eq } from "drizzle-orm";

type Params = {
  params: {
    id: string;
  };
};

export default async function AdminClientDetailPage({ params }: Params) {
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return null;
  }

  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, params.id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!client) {
    notFound();
  }

  const [integrationRows, brandRows, competitorRows] = await Promise.all([
    db
      .select()
      .from(integrations)
      .where(eq(integrations.clientId, client.id)),
    db
      .select()
      .from(brandEntities)
      .where(eq(brandEntities.clientId, client.id)),
    db
      .select()
      .from(competitorEntities)
      .where(eq(competitorEntities.clientId, client.id)),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{client.name}</h1>
        <p className="text-sm text-muted-foreground">
          Configure integrations, brand entities, competitors, and GEO program
          defaults for this client.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            Website:{" "}
            <a
              href={client.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {client.websiteUrl}
            </a>
          </p>
          <p>Industry: {client.industry ?? "—"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {integrationRows.length === 0 ? (
            <p className="text-muted-foreground">
              No integrations configured yet. GA4, GSC, AHREFS/SEMRush, and CMS
              integrations will appear here.
            </p>
          ) : (
            <ul className="space-y-1">
              {integrationRows.map((i) => (
                <li key={i.id}>
                  {i.type} — {i.status}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Brand Entities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {brandRows.length === 0 ? (
              <p className="text-muted-foreground">
                Define key brand entities you want AI engines to understand and
                reference in answers.
              </p>
            ) : (
              <ul className="space-y-1">
                {brandRows.map((e) => (
                  <li key={e.id}>
                    <span className="font-medium">{e.entityName}</span>{" "}
                    <span className="text-muted-foreground">
                      ({e.entityType})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competitor Entities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {competitorRows.length === 0 ? (
              <p className="text-muted-foreground">
                Add competitor entities to track share-of-voice and perception
                gaps in AI answers.
              </p>
            ) : (
              <ul className="space-y-1">
                {competitorRows.map((e) => (
                  <li key={e.id}>
                    <span className="font-medium">{e.entityName}</span>{" "}
                    <span className="text-muted-foreground">
                      ({e.entityType})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

