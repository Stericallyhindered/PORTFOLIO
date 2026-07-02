import { getSessionContext } from "@/lib/auth/session";
import { getActiveClientForOrg } from "@/lib/context/active-client";
import { fastapiFetch } from "@/lib/fastapiClient";

type RecommendationRow = {
  id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  rationale: string;
  status: string;
  estimated_impact: number | null;
  page_url: string | null;
};

export const metadata = {
  title: "Recommendations Board | GEO Command Center",
};

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "schema":
      return "🏗️";
    case "content":
      return "📝";
    case "authority":
      return "🏆";
    case "citation":
      return "📚";
    case "technical":
      return "⚙️";
    default:
      return "📋";
  }
}

export default async function RecommendationsPage() {
  const session = await getSessionContext();
  if (!session?.currentOrgId) return null;
  const { activeClient } = await getActiveClientForOrg(session.currentOrgId);
  const projectId = activeClient?.id;

  const data = await fastapiFetch<{ items: RecommendationRow[] }>(
    projectId
      ? `/recommendations?project_id=${encodeURIComponent(projectId)}`
      : "/recommendations",
    undefined,
    session.currentOrgId,
  ).catch(() => ({ items: [] }));

  // Group recommendations by page
  const byPage = new Map<string, RecommendationRow[]>();
  for (const rec of data.items) {
    const key = rec.page_url || "General";
    if (!byPage.has(key)) {
      byPage.set(key, []);
    }
    byPage.get(key)!.push(rec);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">GEO Recommendations</h1>
        <p className="text-sm text-muted-foreground">
          Page-specific recommendations to improve AI visibility, citation readiness, and schema optimization.
        </p>
      </div>

      {data.items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No recommendations yet. Run a GEO audit to generate page-specific recommendations.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(byPage.entries()).map(([pageUrl, recs]) => (
            <div key={pageUrl} className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-3 border-b">
                <h2 className="font-medium text-sm">
                  {pageUrl === "General" ? (
                    "General Recommendations"
                  ) : (
                    <a 
                      href={pageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {pageUrl}
                    </a>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {recs.length} recommendation{recs.length !== 1 ? "s" : ""}
                </p>
              </div>
              
              <div className="divide-y">
                {recs.map((rec) => (
                  <div key={rec.id} className="p-4 hover:bg-muted/30">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getCategoryIcon(rec.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{rec.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded border ${getPriorityColor(rec.priority)}`}>
                            {rec.priority}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                            {rec.category}
                          </span>
                          {rec.estimated_impact && (
                            <span className="text-xs text-muted-foreground">
                              +{rec.estimated_impact} impact
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {rec.description}
                        </div>
                        
                        {rec.rationale && (
                          <p className="mt-2 text-xs text-muted-foreground italic">
                            Why: {rec.rationale}
                          </p>
                        )}
                      </div>
                      
                      <span className={`text-xs px-2 py-1 rounded ${
                        rec.status === "open" 
                          ? "bg-blue-100 text-blue-700" 
                          : rec.status === "done"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
