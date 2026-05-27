'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(10,10,15,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem', height: 60,
      }}>
        {/* Logo */}
        <Link href={isSignedIn ? '/dashboard' : '/'} style={{
          fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Quiz<span style={{ color: 'var(--accent-bright)' }}>Arena</span>
          <span className="mono" style={{
            fontSize: '0.6rem', padding: '2px 6px',
            borderRadius: 4, background: 'var(--accent-dim)',
            color: 'var(--accent-bright)', marginLeft: 2,
          }}>BETA</span>
        </Link>

        {/* Links + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {isSignedIn && links.map(l => (
            <Link key={l.href} href={l.href} style={{
              fontSize: '0.875rem', fontWeight: 600,
              color: pathname === l.href ? 'var(--text)' : 'var(--text-muted)',
              transition: 'color 0.15s',
              borderBottom: pathname === l.href ? '2px solid var(--accent-bright)' : '2px solid transparent',
              paddingBottom: 2,
            }}>
              {l.label}
            </Link>
          ))}
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Link href="/sign-in" style={{
              padding: '6px 16px', borderRadius: 8,
              background: 'var(--accent)', color: '#fff',
              fontWeight: 700, fontSize: '0.85rem',
            }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
