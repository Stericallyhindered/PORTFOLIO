// #region agent log
/**
 * Vercel build sanity check for DATABASE_URL.
 * IMPORTANT: Do not print secrets. This script only prints booleans/shape info.
 */
function getUrlShapeInfo(raw) {
  const s = String(raw ?? "");
  const trimmed = s.trim();
  const startsPostgres =
    trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://");
  const containsPostgres =
    s.includes("postgresql://") || s.includes("postgres://");
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  const scheme = schemeMatch ? schemeMatch[1] : null;
  const firstNonWsMatch = s.match(/^\s*(.)/);
  const firstNonWs = firstNonWsMatch ? firstNonWsMatch[1] : null;
  const hasLeadingOrTrailingQuotes =
    /^\s*['"]/.test(s) || /['"]\s*$/.test(s);
  const looksLikePsqlCommand = /^\s*psql\b/i.test(s);
  const hasAnyWhitespace = /\s/.test(s);
  return {
    present: !!raw,
    length: s.length,
    scheme,
    firstNonWs,
    startsPostgres,
    containsPostgres,
    hasLeadingOrTrailingQuotes,
    looksLikePsqlCommand,
    hasAnyWhitespace,
  };
}

const info = getUrlShapeInfo(process.env.DATABASE_URL);

// Vercel build metadata (non-secret). Helps prove which repo/branch/commit is being built.
const vercelMeta = {
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  VERCEL_GIT_PROVIDER: process.env.VERCEL_GIT_PROVIDER,
  VERCEL_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG,
  VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER,
  VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
  VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
};

console.log("[vercel-env-check] Vercel git meta:", JSON.stringify(vercelMeta));
console.log("[vercel-env-check] DATABASE_URL shape:", JSON.stringify(info));

if (!info.present) {
  console.error(
    "[vercel-env-check] DATABASE_URL is missing. Set it in Vercel Project → Settings → Environment Variables."
  );
  process.exit(1);
}

if (!info.startsPostgres) {
  console.error(
    "[vercel-env-check] DATABASE_URL is present but does not start with postgres:// or postgresql://. Common causes: you pasted `psql 'postgresql://...'`, or added quotes, or leading whitespace/newline."
  );
  process.exit(1);
}
// #endregion agent log

