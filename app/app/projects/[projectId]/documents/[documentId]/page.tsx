import { redirect } from 'next/navigation';

export default async function LegacyDocumentDetail({
  params,
}: {
  params: Promise<{ projectId: string; documentId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/app/projects/${projectId}`);
}
