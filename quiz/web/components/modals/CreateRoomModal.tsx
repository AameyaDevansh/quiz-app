'use client';

import { useState } from 'react';
import type { Quiz, Question } from '@/lib/api';

interface Props {
  onClose: () => void;
  onCreate: (data: Partial<Quiz>) => Promise<void>;
}

const EMPTY_Q = (): Partial<Question> => ({
  text: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 20,
});

export default function CreateQuizModal({ onClose, onCreate }: Props) {
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [questions, setQ]       = useState<Partial<Question>[]>([EMPTY_Q()]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const addQ = () => setQ(qs => [...qs, EMPTY_Q()]);

  const updateQ = (i: number, field: keyof Question, val: unknown) =>
    setQ(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: val } : q));

  const updateOption = (qi: number, oi: number, val: string) =>
    setQ(qs => qs.map((q, i) => {
      if (i !== qi) return q;
      const opts = [...(q.options || [])];
      opts[oi] = val;
      return { ...q, options: opts };
    }));

  const removeQ = (i: number) => setQ(qs => qs.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!title.trim()) { setError('Title required'); return; }
    if (questions.some(q => !q.text?.trim())) { setError('All questions need text'); return; }
    setLoading(true); setError('');
    try {
      await onCreate({ title, description: desc, questions: questions as Question[] });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally { setLoading(false); }
  };

  return (
    <Backdrop onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: '100%', maxWidth: 680,
        maxHeight: '90vh', overflowY: 'auto', padding: '2rem',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Create Quiz</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <Input label="Title" value={title} onChange={setTitle} placeholder="e.g. Science Bowl 2026" />
        <Input label="Description (optional)" value={desc} onChange={setDesc} placeholder="What's this quiz about?" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            QUESTIONS ({questions.length})
          </h3>
          {questions.map((q, qi) => (
            <div key={qi} style={{
              background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', padding: '1.25rem',
              display: 'flex', flexDirection: 'column', gap: '0.875rem',
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span className="mono" style={{ color: 'var(--text-dim)', fontSize: '0.8rem', paddingTop: 6, minWidth: 22 }}>
                  {qi + 1}.
                </span>
                <textarea value={q.text || ''} onChange={e => updateQ(qi, 'text', e.target.value)}
                  placeholder="Question text…" rows={2}
                  style={{ ...inputStyle, resize: 'vertical', flex: 1 }} />
                {questions.length > 1 && (
                  <button onClick={() => removeQ(qi)} style={{ ...closeBtn, marginTop: 4 }}>✕</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingLeft: 28 }}>
                {(q.options || []).map((opt, oi) => (
                  <div key={oi} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => updateQ(qi, 'correctIndex', oi)}
                      style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: '2px solid',
                        borderColor: q.correctIndex === oi ? 'var(--green)' : 'var(--border-bright)',
                        background: q.correctIndex === oi ? 'var(--green)' : 'transparent',
                        cursor: 'pointer',
                      }} />
                    <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '0.85rem' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', paddingLeft: 28, alignItems: 'center' }}>
                <label className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  TIME LIMIT
                </label>
                <select value={q.timeLimit} onChange={e => updateQ(qi, 'timeLimit', Number(e.target.value))}
                  style={{ ...inputStyle, width: 80, padding: '4px 8px', fontSize: '0.85rem' }}>
                  {[10, 15, 20, 30, 45, 60].map(t => <option key={t} value={t}>{t}s</option>)}
                </select>
              </div>
            </div>
          ))}
          <button onClick={addQ} style={{
            padding: '0.75rem', border: '1px dashed var(--border-bright)',
            borderRadius: 'var(--radius-sm)', background: 'transparent',
            color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
          >
            + Add Question
          </button>
        </div>

        {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '0.75rem 1.5rem', border: '1px solid var(--border-bright)',
            borderRadius: 'var(--radius-sm)', background: 'transparent',
            color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem',
          }}>
            Cancel
          </button>
          <button onClick={submit} disabled={loading} style={{
            padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)',
            background: loading ? 'var(--accent-dim)' : 'var(--accent)',
            color: '#fff', fontWeight: 700, fontSize: '0.875rem', border: 'none',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Creating…' : 'Create Quiz'}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function Backdrop({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} className="animate-fade-in">
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={inputStyle} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.875rem',
  color: 'var(--text)', fontSize: '0.9rem', outline: 'none',
  width: '100%', transition: 'border-color 0.15s',
};

const closeBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6,
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--text-muted)', fontSize: '0.75rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};
