import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mosque Management System',
  description: 'Mosque tracking and fee management portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
