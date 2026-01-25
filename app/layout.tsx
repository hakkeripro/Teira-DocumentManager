import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TEIRA',
  description: 'TEIRA Document Manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body>
        {children}
      </body>
    </html>
  );
}
