/**
 * (admin) route group — Layer 4 of the Safety architecture (PRD §10).
 *
 * Every page under this group is gated by `requireAdmin()` so a parent
 * with a valid session who guesses an `/admin/...` URL is silently
 * redirected to `/dashboard` rather than told the area exists.
 */

import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
