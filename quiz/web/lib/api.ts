const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { token, ...rest } = opts;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...rest, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

export function createApiClient(token?: string) {
  return {
    get: <T = unknown>(path: string, init?: Omit<RequestOptions, 'method' | 'body' | 'token'>) =>
      request<T>(path, { ...init, method: 'GET', token }),

    post: <T = unknown, B = unknown>(
      path: string,
      body?: B,
      init?: Omit<RequestOptions, 'method' | 'body' | 'token'>,
    ) =>
      request<T>(path, {
        ...init,
        method: 'POST',
        body: body === undefined ? undefined : JSON.stringify(body),
        token,
      }),

    put: <T = unknown, B = unknown>(
      path: string,
      body?: B,
      init?: Omit<RequestOptions, 'method' | 'body' | 'token'>,
    ) =>
      request<T>(path, {
        ...init,
        method: 'PUT',
        body: body === undefined ? undefined : JSON.stringify(body),
        token,
      }),

    delete: <T = unknown>(path: string, init?: Omit<RequestOptions, 'method' | 'body' | 'token'>) =>
      request<T>(path, { ...init, method: 'DELETE', token }),
  };
}

// ── Quiz endpoints (quiz.routes.ts) ──────────────────────────────────────────
// Shape mirrors quiz/server/src/models/Quiz.model.ts exactly. `correctAnswer`
// is deliberately absent — the server strips it from every REST response.

export const GENRES = [
  'general',
  'geography',
  'sport',
  'history',
  'entertainment',
  'science',
] as const;

export type Genre = typeof GENRES[number];

export interface Question {
  question: string;
  options?: string[];
  type: 'MCQ' | 'BLANK';
  timeLimit: number;
  points: number;
}

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  genre: string;
  questions: Question[];
  createdBy: string | 'AI' | { _id: string; username: string };
  createdAt: string;
}

// Used only inside the quiz-creation form's local state, before it's POSTed —
// this is the one place `correctAnswer` legitimately exists client-side.
export interface QuizDraftQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'MCQ' | 'BLANK';
  timeLimit: number;
  points: number;
}

export interface CreateQuizInput {
  title: string;
  description?: string;
  genre: string;
  questions: QuizDraftQuestion[];
}

export const quizApi = {
  list: (token: string, genre?: string) =>
    request<Quiz[]>(`/api/quizzes${genre ? `?genre=${encodeURIComponent(genre)}` : ''}`, { token }),

  get: (id: string, token: string) =>
    request<Quiz>(`/api/quizzes/${id}`, { token }),

  create: (data: CreateQuizInput, token: string) =>
    request<Quiz>('/api/quizzes', { method: 'POST', body: JSON.stringify(data), token }),

  delete: (id: string, token: string) =>
    request<{ ok: boolean }>(`/api/quizzes/${id}`, { method: 'DELETE', token }),
};

// ── User endpoints (user.routes.ts) ──────────────────────────────────────────

export interface UserProfile {
  id: string;
  clerkId: string;
  username: string;
  avatar?: string;
  xp: number;
  badges: string[];
  stats: { wins: number; matches: number; accuracy: number };
  createdAt: string;
}

export interface MatchSummary {
  _id: string;
  matchCode: string;
  players: { _id: string; username: string; avatar?: string }[];
  winner?: { _id: string; username: string; avatar?: string };
  scores: Record<string, number>;
  totalQuestions: number;
  createdAt: string;
}

export const userApi = {
  me: (token: string) =>
    request<UserProfile>('/api/users/me', { token }),
};

export const matchApi = {
  history: (token: string) =>
    request<MatchSummary[]>('/api/users/me/matches', { token }),
};
