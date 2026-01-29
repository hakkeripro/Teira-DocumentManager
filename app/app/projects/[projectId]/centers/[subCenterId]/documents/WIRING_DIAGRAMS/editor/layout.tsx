import DocumentFocusMode from '@/components/DocumentFocusMode';

export default function WiringEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DocumentFocusMode />
      {children}
    </>
  );
}
