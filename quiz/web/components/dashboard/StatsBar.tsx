'use client';

interface Stat { label: string; value: string | number; accent?: boolean }

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
      gap: '1px', background: 'var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
      border: '1px solid var(--border)',
    }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: 'var(--surface)', padding: '1.25rem 1.5rem',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '1.75rem', fontWeight: 800,
            color: s.accent ? 'var(--accent-bright)' : 'var(--text)',
          }}>
            {s.value}
          </div>
          <div className="mono" style={{
            fontSize: '0.7rem', color: 'var(--text-dim)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4,
          }}>
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
