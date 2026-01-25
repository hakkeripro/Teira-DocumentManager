import type { DocumentType } from '@prisma/client';

export const DOCUMENT_TYPES: { type: DocumentType; label: string }[] = [
  { type: 'WIRING_DIAGRAMS', label: 'Kytkentäkuvat' },
  { type: 'TEST_LIST', label: 'Testauslista' },
  { type: 'DEVICE_LIST', label: 'Laiteluettelo' },
  { type: 'PULL_LIST', label: 'Kaapeliluettelo' },
  { type: 'NAMEPLATE_LIST' as DocumentType, label: 'Kilpiluettelo' },
];

export function revDisplay(revLetter: string, projectCode: string) {
  return `${revLetter}-${projectCode}`;
}

export function docLabel(t: DocumentType) {
  const found = DOCUMENT_TYPES.find((d) => d.type === t);
  return found ? found.label : t;
}
