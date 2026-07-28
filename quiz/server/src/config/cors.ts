// Comma-separated list of allowed origins, e.g.
// ALLOWED_ORIGINS=https://quiz-app.vercel.app,https://quiz-app-git-preview.vercel.app
// Falls back to the local Next.js dev server so `npm run dev` keeps working
// without any env setup.
export const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
