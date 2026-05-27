'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}

export default function JoinRoomModal({ onClose, onJoin }: Props) {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Enter a room code'); return; }
    setLoading(true); setError('');
    try {
      await onJoin(trimmed);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join room');
    } finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} className="animate-fade-in">
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '100%', maxWidth: 400,
        padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Join Room</h2>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Room Code
          </label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="e.g. XKCD42"
            maxLength={8}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem',
              color: 'var(--text)', fontSize: '1.5rem', fontFamily: 'var(--font-mono)',
              fontWeight: 700, letterSpacing: '0.2em', textAlign: 'center',
              outline: 'none', width: '100%',
            }}
            autoFocus
          />
          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}
        </div>

        <button onClick={submit} disabled={loading} style={{
          padding: '0.875rem', borderRadius: 'var(--radius-sm)',
          background: loading ? 'var(--accent-dim)' : 'var(--accent)',
          color: '#fff', fontWeight: 700, fontSize: '0.95rem', border: 'none',
          opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Joining…' : 'Join Game'}
        </button>
      </div>
    </div>
  );
}
