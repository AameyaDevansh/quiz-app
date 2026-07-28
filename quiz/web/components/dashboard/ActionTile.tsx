'use client';

interface Props {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

export default function ActionTile({ icon, title, description, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        textAlign: 'left', transition: 'border-color 0.2s, transform 0.2s',
        width: '100%',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)';
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
      }}
    >
      <span style={{ fontSize: '1.75rem' }}>{icon}</span>
      <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{description}</p>
    </button>
  );
}
