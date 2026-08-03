import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Radio Ninada Admin Dashboard',
  description: 'Management Portal for Radio Ninada Community Radio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 antialiased font-sans">{children}</body>
    </html>
  );
}
