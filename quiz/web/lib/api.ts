const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

async function getToken(): Promise<string | null> {
  // Clerk exposes getToken via useAuth hook in components.
  // For non-hook contexts (server actions / util fns), pass token explicitly.
  return null;
}

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

export interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
  createdBy: string;
  createdAt: string;
}

export interface Question {
  _id: string;
  text: string;
  options: string[];
  correctIndex: number;   // used server-side; won't be sent during active match
  timeLimit: number;      // seconds
}

export const quizApi = {
  list: (token: string) =>
    request<Quiz[]>('/api/quiz', { token }),

  get: (id: string, token: string) =>
    request<Quiz>(`/api/quiz/${id}`, { token }),

  create: (data: Partial<Quiz>, token: string) =>
    request<Quiz>('/api/quiz', { method: 'POST', body: JSON.stringify(data), token }),

  update: (id: string, data: Partial<Quiz>, token: string) =>
    request<Quiz>(`/api/quiz/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),

  delete: (id: string, token: string) =>
    request<{ ok: boolean }>(`/api/quiz/${id}`, { method: 'DELETE', token }),
};

// ── Room / Match endpoints ────────────────────────────────────────────────────

export interface Room {
  code: string;
  quizId: string;
  hostId: string;
  players: Player[];
  status: 'waiting' | 'active' | 'finished';
}

export interface Player {
  userId: string;
  username: string;
  score: number;
  avatar?: string;
}

export const roomApi = {
  // TODO: adjust endpoint to match your router
  create: (quizId: string, token: string) =>
    request<Room>('/api/match/create', { method: 'POST', body: JSON.stringify({ quizId }), token }),

  join: (code: string, token: string) =>
    request<Room>(`/api/match/join/${code}`, { method: 'POST', token }),

  get: (code: string, token: string) =>
    request<Room>(`/api/match/${code}`, { token }),
};

// ── User endpoints (user.routes.ts) ──────────────────────────────────────────

export interface UserProfile {
  _id: string;
  clerkId: string;
  username: string;
  email: string;
  stats: { played: number; won: number; totalScore: number };
}

export const userApi = {
  me: (token: string) =>
    request<UserProfile>('/api/user/me', { token }),

  sync: (token: string) =>
    request<UserProfile>('/api/user/sync', { method: 'POST', token }),
};
