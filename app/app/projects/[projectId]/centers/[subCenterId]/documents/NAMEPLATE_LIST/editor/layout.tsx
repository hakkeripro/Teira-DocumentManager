import DocumentFocusMode from '@/components/DocumentFocusMode';

export default function NameplateListEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DocumentFocusMode />
      {children}
    </>
  );
}
