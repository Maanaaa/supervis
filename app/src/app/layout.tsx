import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Supervision d'Alertes — Astreinte",
  description: "Tableau de bord de supervision temps réel et gestion d'astreinte",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
