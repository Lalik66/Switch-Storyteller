import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";

/**
 * Protected routes that require authentication.
 * These are also configured in src/proxy.ts for optimistic redirects.
 */
export const protectedRoutes = [
  "/chat",
  "/dashboard",
  "/profile",
  "/stories",
  "/children",
  "/characters",
  "/parent", // (parent) library, settings, etc. — e.g. /parent/stories
  "/admin", // (admin) Layer 4 moderation queue — additionally role-gated
];

/**
 * Checks if the current request is authenticated.
 * Should be called in Server Components for protected routes.
 *
 * @returns The session object if authenticated
 * @throws Redirects to home page if not authenticated
 */
export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  return session;
}

/**
 * Gets the current session without requiring authentication.
 * Returns null if not authenticated.
 *
 * @returns The session object or null
 */
export async function getOptionalSession() {
  return await auth.api.getSession({ headers: await headers() });
}

/**
 * Loads the role for the current authenticated user. Returns "user" if
 * the column is missing (back-compat) or the row cannot be found.
 */
async function loadUserRole(userId: string): Promise<"user" | "admin"> {
  const [row] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row?.role ?? "user";
}

/**
 * Server-Component / Route-Handler guard for the (admin) area. Redirects
 * unauthenticated users to "/" and non-admin users to "/dashboard" so we
 * never leak the existence of the admin route to a parent who happens to
 * type "/admin/moderation" into the URL bar.
 *
 * Returns the session augmented with the resolved role for downstream use.
 */
export async function requireAdmin() {
  const session = await requireAuth();
  const role = await loadUserRole(session.user.id);
  if (role !== "admin") {
    redirect("/dashboard");
  }
  return { ...session, role };
}

/**
 * Checks if a given path is a protected route.
 *
 * @param path - The path to check
 * @returns True if the path requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  return protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}
