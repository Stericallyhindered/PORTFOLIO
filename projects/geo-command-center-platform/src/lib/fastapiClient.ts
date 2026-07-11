const DEFAULT_BASE = "http://localhost:8000/api/v1";

function resolveBaseUrl() {
  const raw = (
    process.env.NEXT_PUBLIC_BACKEND_API_URL ??
    process.env.BACKEND_API_URL ??
    DEFAULT_BASE
  ).replace(/\/$/, "");
  return raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
}

function resolveOrgId() {
  return process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "";
}

export async function fastapiFetch<T>(
  path: string,
  init?: RequestInit,
  orgId?: string,
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = 15000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${resolveBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-org-id": orgId ?? resolveOrgId(),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `FastAPI request timed out after ${timeoutMs}ms (${path}). Check backend/DB connectivity.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FastAPI request failed (${response.status}): ${errorText}`);
  }
  return (await response.json()) as T;
}
