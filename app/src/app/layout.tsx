import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';

export const metadata: Metadata = {
  title: "SUPERVIS — Dashboard d'Astreinte & Surveillance Temps Réel",
  description:
    "Tableau de bord de surveillance et gestion d'astreinte sub-milliseconde pour hébergeur informatique.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <Navigation />
        <main className="container page-wrapper">{children}</main>
      </body>
    </html>
  );
}
