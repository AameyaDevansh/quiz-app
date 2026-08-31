'use client';

import { useState } from 'react';
import { GENRES, quizApi, type CreateQuizInput } from '@/lib/api';

interface Props {
  token: string;
  onClose: () => void;
  onSaved: (quizGenre: string) => Promise<void> | void;
}

const field: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.85rem', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)',
};

export default function AIQuizModal({ token, onClose, onSaved }: Props) {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [genre, setGenre] = useState<string>('general');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(10);
  const [draft, setDraft] = useState<CreateQuizInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!prompt.trim() && !file) return setError('Write a topic or upload a source file.');
    setBusy(true); setError('');
    try {
      const form = new FormData();
      form.set('prompt', prompt);
      form.set('genre', genre);
      form.set('difficulty', difficulty);
      form.set('questionCount', String(count));
      if (file) form.set('file', file);
      setDraft(await quizApi.generate(form, token));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally { setBusy(false); }
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true); setError('');
    try {
      await quizApi.create({ ...draft, difficulty, mode: 'ai', source: file?.name || prompt }, token);
      await onSaved(draft.genre);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save quiz');
    } finally { setBusy(false); }
  };

  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, maxHeight: '92vh', overflow: 'auto', padding: 28, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <div><h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Generate a study quiz</h2><p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Research a topic or turn your notes into a playable quiz.</p></div>
        <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)', border: 0, fontSize: 20 }}>×</button>
      </div>

      {!draft ? <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <label>Topic or instructions<textarea rows={4} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Example: Research the Mughal Empire and make a quiz focused on major rulers and reforms" style={{ ...field, display: 'block', marginTop: 7, resize: 'vertical' }} /></label>
        <label>Source material (optional)<input type="file" accept=".pdf,.txt,.md,.csv,.json,.doc,.docx,.ppt,.pptx" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ ...field, display: 'block', marginTop: 7 }} /><small style={{ color: 'var(--text-dim)' }}>PDF, documents, slides, or text up to 10 MB.</small></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <label>Genre<select value={genre} onChange={e => setGenre(e.target.value)} style={{ ...field, display: 'block', marginTop: 7 }}>{GENRES.map(g => <option key={g}>{g}</option>)}</select></label>
          <label>Level<select value={difficulty} onChange={e => setDifficulty(e.target.value as typeof difficulty)} style={{ ...field, display: 'block', marginTop: 7 }}><option>easy</option><option>medium</option><option>hard</option></select></label>
          <label>Questions<select value={count} onChange={e => setCount(Number(e.target.value))} style={{ ...field, display: 'block', marginTop: 7 }}>{[5,10,15,20].map(n => <option key={n}>{n}</option>)}</select></label>
        </div>
        <button disabled={busy} onClick={generate} style={{ ...field, background: 'var(--accent)', color: '#fff', fontWeight: 800, border: 0 }}>{busy ? 'Researching and generating…' : 'Generate quiz'}</button>
      </div> : <div style={{ marginTop: 24 }}>
        <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} style={{ ...field, fontWeight: 800, fontSize: '1.05rem' }} />
        <p style={{ color: 'var(--text-muted)', margin: '10px 0 18px' }}>{draft.description}</p>
        <div style={{ display: 'grid', gap: 10 }}>{draft.questions.map((q, i) => <div key={i} style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 8 }}><strong>{i + 1}. {q.question}</strong><div style={{ color: 'var(--text-muted)', marginTop: 6 }}>{q.options.join(' · ')}</div><div style={{ color: 'var(--green)', marginTop: 5 }}>Answer: {q.correctAnswer}</div></div>)}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}><button onClick={() => setDraft(null)} style={field}>Regenerate</button><button disabled={busy} onClick={save} style={{ ...field, width: 'auto', background: 'var(--accent)', color: '#fff', fontWeight: 800 }}>{busy ? 'Saving…' : 'Save & play'}</button></div>
      </div>}
      {error && <p style={{ color: 'var(--red)', marginTop: 14 }}>{error}</p>}
    </div>
  </div>;
}
