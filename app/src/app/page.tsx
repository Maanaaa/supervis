export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
          Supervision d&apos;Alertes &amp; Astreinte
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Tableau de bord de surveillance temps réel pour petit hébergeur.
        </p>
      </header>

      <section
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Socle opérationnel prêt</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Next.js App Router, TypeScript strict et serveur temps réel Socket.IO initialisés.
        </p>
      </section>
    </main>
  );
}
