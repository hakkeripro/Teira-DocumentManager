import { PDFDocument, StandardFonts } from 'pdf-lib';

export type PdfMeta = {
  title: string;
  projectCode: string;
  documentTypeLabel: string;
  revisionDisplay: string;
};

export async function generatePlaceholderPdf(meta: PdfMeta): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const lines = [
    meta.title,
    `Project: ${meta.projectCode}`,
    `Document: ${meta.documentTypeLabel}`,
    `Revision: ${meta.revisionDisplay}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    'NOTE: This is a Sprint 1 placeholder PDF.'
  ];

  let y = 780;
  for (const line of lines) {
    page.drawText(line, {
      x: 60,
      y,
      size: 18,
      font
    });
    y -= 32;
  }

  return await pdfDoc.save();
}
