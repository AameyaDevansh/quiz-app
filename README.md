# QuizArena

Real-time multiplayer quiz platform. Pick a genre, host a room, and play live against friends with a synced countdown and a scoreboard that updates as answers come in — built to handle up to 100 players in a single room.

## Stack

- **`quiz/server`** — Express + Socket.IO + MongoDB (Mongoose) + Redis + BullMQ + Clerk auth
- **`quiz/web`** — Next.js (App Router) + Clerk + socket.io-client

Rooms, live scores, and question timing all live in Redis (Hash for room state, Sorted Set for scores, BullMQ delayed jobs for the auto-advancing question timer) so a single room can handle 100 concurrent players without racing writes. MongoDB stores quizzes, users, and match history.

## Genres

`general`, `geography`, `sport`, `history`, `entertainment`, `science` — seeded with real trivia and bulk-importable from [Open Trivia DB](https://opentdb.com).

## Local setup

**1. Start Redis** (Docker):

```bash
cd quiz/server
docker compose -f docker/redis.yml up -d
```

**2. Configure environment variables**

Copy the example files and fill in real values:

```bash
cp quiz/server/.env.example quiz/server/.env
cp quiz/web/.env.example quiz/web/.env.local
```

- `quiz/server/.env` needs `MONGO_URI` (MongoDB Atlas or local), `REDIS_URL`, `CLERK_SECRET_KEY`
- `quiz/web/.env.local` needs your Clerk publishable/secret keys and `NEXT_PUBLIC_BACKEND_URL`

**3. Install deps and seed question banks**

```bash
cd quiz/server
npm install
npm run seed              # ~16 hand-picked questions per genre
npm run import:opentdb    # bulk-import hundreds more per genre from Open Trivia DB
```

`import:opentdb` is additive and dedupes against what's already stored, so it's safe to re-run anytime. Pass a genre name to import just one: `npm run import:opentdb -- science`.

**4. Run the backend**

```bash
npm run dev
```

Runs on `http://localhost:4000`. You should see:

```
✅ Redis clients connected
✅ MongoDB connected
🚀 Server running on http://localhost:4000
```

**5. Run the frontend**

```bash
cd quiz/web
npm install
npm run dev
```

Runs on `http://localhost:3000`.

**6. Play**

Sign in from two different browser sessions (e.g. a normal window + an incognito window), browse a genre on the dashboard, host a room, join with the room code from the other session, and start the quiz.

## Deploying (frontend and backend on separate platforms)

Recommended split: **Vercel** for `quiz/web`, **Render** (or Railway) for `quiz/server`, managed Redis (Render Key Value or Upstash), MongoDB Atlas for the database.

**Backend** — root directory `quiz/server`, build command `npm install` (a `postinstall` hook runs `tsc` automatically), start command `npm start`. Environment variables:

| Var | Value |
|---|---|
| `MONGO_URI` | Atlas connection string |
| `REDIS_URL` | your managed Redis's connection string |
| `CLERK_SECRET_KEY` | Clerk production secret key |
| `ALLOWED_ORIGINS` | your deployed frontend URL, e.g. `https://quiz-app.vercel.app` |

**Frontend** — root directory `quiz/web`. Environment variables:

| Var | Value |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk production publishable key |
| `CLERK_SECRET_KEY` | Clerk production secret key |
| `NEXT_PUBLIC_BACKEND_URL` | your deployed backend URL |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` / `AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL` | `/sign-in`, `/sign-up`, `/dashboard`, `/dashboard` |

Deploy the backend first, then the frontend, then go back and set `ALLOWED_ORIGINS` on the backend once the frontend's final URL is known (redeploy after). Also add your production domain to Clerk's allowed origins in the Clerk dashboard.

## Repo layout

```
quiz/
  server/
    src/
      config/       # mongo, redis, clerk, cors
      models/       # User, Quiz, Match (Mongoose)
      routes/       # REST: /api/quizzes, /api/users
      services/     # business logic behind the routes
      sockets/       # room lifecycle + live game engine (Socket.IO)
      jobs/          # BullMQ question-timer worker
      scripts/       # seedQuizzes.ts, importOpenTDB.ts
  web/
    app/             # Next.js App Router pages (dashboard, room/[code])
    components/      # dashboard tiles/browser, modals
    lib/             # api client, socket client, Clerk hook
```
