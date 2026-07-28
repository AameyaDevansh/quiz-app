'use client';

import { useState } from 'react';
import type { Quiz } from '@/lib/api';

interface Props {
  quiz: Quiz;
  onClose: () => void;
  onCreate: (data: { visibility: 'public' | 'private'; maxPlayers: number }) => void;
}

export default function CreateRoomModal({ quiz, onClose, onCreate }: Props) {
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [maxPlayers, setMaxPlayers] = useState(50);

  const submit = () => {
    onCreate({ visibility, maxPlayers });
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} className="animate-fade-in">
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '100%', maxWidth: 440,
        padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Host a Room</h2>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
          }}>✕</button>
        </div>

        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '1rem',
        }}>
          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{quiz.title}</p>
          <p className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4, textTransform: 'uppercase' }}>
            {quiz.genre} · {quiz.questions.length} questions
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Visibility
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['private', 'public'] as const).map(v => (
              <button key={v} onClick={() => setVisibility(v)} style={{
                flex: 1, padding: '0.65rem', borderRadius: 'var(--radius-sm)',
                border: '1px solid', borderColor: visibility === v ? 'var(--accent)' : 'var(--border)',
                background: visibility === v ? 'var(--accent-dim)' : 'transparent',
                color: visibility === v ? 'var(--accent-bright)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize',
              }}>
                {v === 'public' ? '🌍 Public' : '🔒 Private'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Max Players ({maxPlayers})
          </label>
          <input
            type="range" min={2} max={100} value={maxPlayers}
            onChange={e => setMaxPlayers(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
        </div>

        <button onClick={submit} style={{
          padding: '0.875rem', borderRadius: 'var(--radius-sm)',
          background: 'var(--accent)', color: '#fff', fontWeight: 700,
          fontSize: '0.95rem', border: 'none',
        }}>
          Create Room
        </button>
      </div>
    </div>
  );
}
