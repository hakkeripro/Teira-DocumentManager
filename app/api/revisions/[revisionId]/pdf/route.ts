import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireActorApi } from '@/lib/actorApi';
import { LocalStorageAdapter } from '@/lib/storage/local';
import { SupabaseStorageAdapter } from '@/lib/storage/supabase';
import { revDisplay } from '@/lib/docTypes';

type RouteContext = {
  params: Promise<{ revisionId: string }>;
};

export async function GET(_req: Request, ctx: RouteContext) {
  const actor = await requireActorApi();
  const { revisionId } = await ctx.params;

  const revision = await db.documentRevision.findFirst({
    where: { id: revisionId, companyId: actor.companyId },
    include: {
      document: { include: { project: true, subCenter: true } },
      assets: true,
    },
  });
  if (!revision) return new NextResponse('Not found', { status: 404 });

  const pdfAsset = revision.assets.find((a) => a.assetType === 'PDF');
  if (!pdfAsset) return new NextResponse('PDF not found', { status: 404 });

  const projectCode = revision.document.project.code;
  const scCode = revision.document.subCenter.code ?? 'CENTER';
  const rev = revDisplay(revision.revLetter, projectCode);
  const filename = `${revision.document.type}-${rev}-${scCode}.pdf`;

  if (pdfAsset.storageProvider === 'supabase') {
    const adapter = new SupabaseStorageAdapter();
    const signed = await adapter.createSignedUrl(pdfAsset.storageKey, 60);
    return NextResponse.redirect(signed);
  }

  const adapter = new LocalStorageAdapter();
  const buf = await adapter.read(pdfAsset.storageKey);
  const bytes = Uint8Array.from(buf);
  return new NextResponse(bytes, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
}
