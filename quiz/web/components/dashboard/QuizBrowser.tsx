'use client';

import { useEffect, useState, useCallback } from 'react';
import { GENRES, quizApi, userApi, type Quiz, type QuizDraftQuestion } from '@/lib/api';
import QuizCard from './QuizCard';
import CreateQuizModal from '../modals/CreateQuizModal';

interface Props {
  token: string;
  onSelectQuiz: (quiz: Quiz) => void;
}

export default function QuizBrowser({ token, onSelectQuiz }: Props) {
  const [genre, setGenre] = useState<string>(GENRES[0]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await quizApi.list(token, genre);
      setQuizzes(list);
    } finally {
      setLoading(false);
    }
  }, [token, genre]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    userApi.me(token).then(profile => setCurrentUserId(profile.id)).catch(() => {});
  }, [token]);

  const handleCreateQuiz = async (data: { title: string; description?: string; genre: string; questions: QuizDraftQuestion[] }) => {
    await quizApi.create(data, token);
    if (data.genre === genre) await refresh();
  };

  const handleDelete = async (id: string) => {
    await quizApi.delete(id, token);
    setQuizzes(qs => qs.filter(q => q._id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="mono" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {GENRES.map(g => (
            <button key={g} onClick={() => setGenre(g)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
              textTransform: 'capitalize', border: '1px solid',
              borderColor: genre === g ? 'var(--accent)' : 'var(--border)',
              background: genre === g ? 'var(--accent-dim)' : 'transparent',
              color: genre === g ? 'var(--accent-bright)' : 'var(--text-muted)',
            }}>
              {g}
            </button>
          ))}
        </div>

        <button onClick={() => setShowCreate(true)} style={{
          padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 700,
          border: '1px dashed var(--border-bright)', background: 'transparent', color: 'var(--text-muted)',
        }}>
          + Create Your Own
        </button>
      </div>

      {loading ? (
        <p className="mono" style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>loading quizzes…</p>
      ) : quizzes.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No quizzes in this genre yet — be the first to create one.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {quizzes.map(quiz => (
            <QuizCard
              key={quiz._id}
              quiz={quiz}
              onPlay={onSelectQuiz}
              onDelete={handleDelete}
              isOwner={!!currentUserId && typeof quiz.createdBy === 'object' && quiz.createdBy._id === currentUserId}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateQuizModal onClose={() => setShowCreate(false)} onCreate={handleCreateQuiz} />
      )}
    </div>
  );
}
