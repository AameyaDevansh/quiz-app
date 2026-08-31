'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/dashboard');
  }, [isLoaded, isSignedIn, router]);

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, var(--accent-dim) 0%, var(--bg) 60%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '60px 60px', opacity: 0.3,
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)',
      }} />

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 640 }} className="animate-fade-up">
        <div className="mono" style={{
          display: 'inline-block', padding: '4px 14px', marginBottom: '1.5rem',
          border: '1px solid var(--accent-dim)', borderRadius: 20,
          color: 'var(--accent-bright)', fontSize: '0.75rem', letterSpacing: '0.12em',
          background: 'rgba(108,99,255,0.08)',
        }}>
          REAL-TIME · MULTIPLAYER · LIVE
        </div>

        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 800,
          lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '1.5rem',
        }}>
          Quiz<span style={{ color: 'var(--accent-bright)' }}>Arena</span>
        </h1>

        <p style={{
          fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.7,
          marginBottom: '2.5rem', maxWidth: 480, margin: '0 auto 2.5rem',
        }}>
          Create rooms, challenge friends, and compete live.
          See who&apos;s the fastest mind in real time.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up" className="tactile" style={{
            padding: '0.875rem 2rem', borderRadius: 'var(--radius)',
            background: 'var(--accent)', color: '#fff', fontWeight: 700,
            fontSize: '0.95rem', letterSpacing: '0.02em',
            boxShadow: '0 0 32px rgba(255,62,154,0.4), 0 4px 0 var(--accent-dim)',
          }}>
            Get Started
          </Link>
          <Link href="/sign-in" className="tactile" style={{
            padding: '0.875rem 2rem', borderRadius: 'var(--radius)',
            border: '1px solid var(--border-bright)', color: 'var(--text)',
            fontWeight: 600, fontSize: '0.95rem',
          }}>
            Sign In
          </Link>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex', gap: '3rem', justifyContent: 'center', marginTop: '4rem',
          paddingTop: '2rem', borderTop: '1px solid var(--border)',
        }}>
          {[['10ms', 'avg latency'], ['∞', 'questions'], ['live', 'leaderboard']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-bright)' }}>{val}</div>
              <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
