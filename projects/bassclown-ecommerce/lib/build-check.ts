/**
 * Utility to detect if the code is being executed during Next.js build time.
 * 
 * During `next build`, Next.js statically evaluates API routes and other server
 * components to collect metadata and generate static pages. This can cause issues
 * if those routes try to access databases or external services during build.
 * 
 * @example
 * // In an API route:
 * export async function GET(request: Request) {
 *   // Skip execution during build time
 *   if (isBuildTime) {
 *     return Response.json({ message: "Build time - data not available" });
 *   }
 *   
 *   // Normal runtime code...
 * }
 */

/**
 * Detects if code is being executed during Next.js build process.
 * 
 * This checks for:
 * 1. Any NEXT_PHASE that includes "build" (like "phase-production-build")
 * 2. The "phase-export" phase which is also part of static generation
 */
export const isBuildTime =
  (process.env.NEXT_PHASE?.includes('build') ?? false) ||
  process.env.NEXT_PHASE === 'phase-export';

/**
 * Helper function to create a standard API response for build time.
 * Use this in API routes to return a consistent response during build.
 * 
 * @param message Optional custom message (defaults to "Build time - data not available")
 * @param status HTTP status code (defaults to 200)
 * @returns Response object
 */
export function buildTimeResponse(
  message = 'Build time - data not available',
  status = 200
): Response {
  return Response.json(
    { 
      success: true, 
      message,
      buildTime: true,
      data: null
    },
    { status }
  );
}

/**
 * Helper function to create empty data structures during build time.
 * Useful for returning typed empty data that matches your runtime data shape.
 * 
 * @example
 * // Instead of returning null during build:
 * return emptyDataDuringBuild({
 *   users: [],
 *   totalCount: 0,
 *   pagination: { page: 1, pageSize: 10, totalPages: 0 }
 * });
 * 
 * @param emptyData The empty data structure to return
 * @returns The provided empty data if in build time, or undefined if at runtime
 */
export function emptyDataDuringBuild<T>(emptyData: T): T | undefined {
  return isBuildTime ? emptyData : undefined;
}
