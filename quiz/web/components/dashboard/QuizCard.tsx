'use client';

import type { Quiz } from '@/lib/api';

interface Props {
  quiz: Quiz;
  onPlay: (quiz: Quiz) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

export default function QuizCard({ quiz, onPlay, onDelete, isOwner }: Props) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '1rem',
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-bright)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3, flex: 1, marginRight: 8 }}>
          {quiz?.title || "Untitled Quiz"}
        </h3>
        {isOwner && (
          <span className="mono" style={{
            fontSize: '0.6rem', padding: '2px 7px', borderRadius: 4,
            background: 'var(--accent-dim)', color: 'var(--accent-bright)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            YOURS
          </span>
        )}
      </div>

      {quiz?.description && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {quiz?.description || "Untitled Quiz"}
        </p>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Chip label={`${quiz?.questions.length} Qs`} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
        <button onClick={() => onPlay(quiz)} style={{
          flex: 1, padding: '0.625rem 1rem', borderRadius: 'var(--radius-sm)',
          background: 'var(--accent)', color: '#fff', fontWeight: 700,
          fontSize: '0.875rem', border: 'none',
          transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Host Game
        </button>
        {isOwner && onDelete && (
          <button onClick={() => onDelete(quiz._id)} style={{
            padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-bright)', background: 'transparent',
            color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="mono" style={{
      fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20,
      background: 'var(--surface-2)', color: 'var(--text-muted)',
      border: '1px solid var(--border)',
    }}>
      {label}
    </span>
  );
}
