'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: '🚨 Alertes Actives', id: 'nav-alerts' },
    { href: '/history', label: '📜 Historique & MTTR', id: 'nav-history' },
    { href: '/servers', label: '🖥️ Parc Serveurs', id: 'nav-servers' },
  ];

  return (
    <nav
      id="main-navigation"
      style={{
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        marginBottom: '2rem',
      }}
    >
      <div className="container" style={{ display: 'flex', gap: '0.5rem' }}>
        {links.map((link) => {
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              id={link.id}
              href={link.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.85rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive
                  ? '2px solid var(--accent-primary)'
                  : '2px solid transparent',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                transition: 'all var(--transition-fast)',
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
