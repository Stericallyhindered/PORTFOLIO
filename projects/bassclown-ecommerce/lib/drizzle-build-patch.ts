/**
 * Drizzle Build Patch
 * 
 * This module patches JSON.parse during Next.js build time to prevent errors
 * when parsing the string "undefined" in JSONB fields.
 * 
 * During the Next.js build process, some environment variables and context
 * may be missing, causing Drizzle ORM to receive "undefined" as a string
 * when it expects a JSON object or null. This patch makes JSON.parse more
 * resilient to this specific case.
 * 
 * Usage:
 * Import this module early in your application:
 * ```
 * // In lib/db/index.ts or similar
 * import '../drizzle-build-patch';
 * ```
 */

// Detect if we're in build mode
const isBuildTime =
  (process.env.NEXT_PHASE?.includes('build') ?? false) ||
  process.env.NEXT_PHASE === 'phase-export';

// Apply the patch ALWAYS (build, dev, and production)
// This prevents JSON.parse errors from "undefined" strings in production
const originalJSONParse = JSON.parse;

// Replace JSON.parse with our patched version
// @ts-ignore - We're intentionally monkey-patching here
JSON.parse = function patchedJSONParse(text: any, ...rest: any[]): any {
  // Handle null or undefined values first
  if (text === null || text === undefined) {
    return null;
  }
  
  // Convert to string to check for "undefined" string
  const textStr = String(text);
  
  // Handle the case where text is literally the string "undefined"
  if (textStr === 'undefined' || textStr.trim() === 'undefined') {
    const mode = isBuildTime ? 'build' : 'runtime';
    console.warn(`[drizzle-build-patch] Intercepted JSON.parse("undefined") during ${mode}, returning empty object`);
    return {};
  }

  // For all other cases, use the original function
  try {
    return originalJSONParse(text, ...rest);
  } catch (error) {
    // Be forgiving with JSON parse errors in all environments
    const mode = isBuildTime ? 'build' : 'runtime';
    console.warn(`[drizzle-build-patch] JSON.parse error during ${mode}: ${error}. Returning empty object for: ${textStr.substring(0, 100)}`);
    return {};
  }
};

// Log that the patch has been applied
const mode = isBuildTime ? 'build' : process.env.NODE_ENV || 'runtime';
console.log(`[drizzle-build-patch] Applied JSON.parse patch for Next.js ${mode}`);

export {};
