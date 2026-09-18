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
      <head>
        {/* Tailwind CSS CDN script - eta dile mobile build-eo styling 100% guarantee kaj korbe */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
