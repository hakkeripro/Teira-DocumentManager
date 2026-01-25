import { redirect } from 'next/navigation';

/**
 * Backward compatible route (Sprint 1)
 *
 * Sprint 2 introduces Centers under projects; documents live under a center.
 */
export default async function LegacyDocumentsRoute({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/app/projects/${projectId}`);
}
