import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectMongo } from "../config/mongo";
import { Quiz } from "../models/Quiz.model";

const OPENTDB_BASE = "https://opentdb.com/api.php";
const PAGE_SIZE = 50; // OpenTDB's max per request
const PAGES_PER_CATEGORY = 3; // up to 150 per category, fewer if the pool is smaller
const RATE_LIMIT_DELAY_MS = 5500; // OpenTDB allows ~1 request/5s per IP

// Our genres -> OpenTDB category IDs. Entertainment/science pull from a few
// related categories each for breadth.
const GENRE_CATEGORIES: Record<string, number[]> = {
  general: [9], // General Knowledge
  geography: [22], // Geography
  sport: [21], // Sports
  history: [23], // History
  entertainment: [11, 12, 14], // Film, Music, Television
  science: [17, 18, 19], // Science & Nature, Computers, Mathematics
};

interface OpenTDBResult {
  type: "multiple" | "boolean";
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface OpenTDBResponse {
  response_code: number;
  results: OpenTDBResult[];
}

interface ImportedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  type: "MCQ";
  timeLimit: number;
  points: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// OpenTDB is asked to encode responses as RFC 3986 so we can decode with the
// built-in decodeURIComponent instead of pulling in an HTML-entity library.
const fetchCategoryPage = async (categoryId: number, attempt = 0): Promise<OpenTDBResult[]> => {
  const url = `${OPENTDB_BASE}?amount=${PAGE_SIZE}&category=${categoryId}&type=multiple&encode=url3986`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenTDB request failed: ${res.status}`);

  const data = (await res.json()) as OpenTDBResponse;

  if (data.response_code === 5 && attempt < 3) {
    // rate-limited — back off harder and retry
    await sleep(RATE_LIMIT_DELAY_MS * 2);
    return fetchCategoryPage(categoryId, attempt + 1);
  }
  if (data.response_code !== 0) return []; // no more results for this category — nothing left to pull

  return data.results;
};

const toImportedQuestion = (r: OpenTDBResult): ImportedQuestion => {
  const question = decodeURIComponent(r.question);
  const correctAnswer = decodeURIComponent(r.correct_answer);
  const options = shuffle([correctAnswer, ...r.incorrect_answers.map((a) => decodeURIComponent(a))]);

  return { question, options, correctAnswer, type: "MCQ", timeLimit: 20, points: 1000 };
};

const importGenre = async (categoryIds: number[]): Promise<ImportedQuestion[]> => {
  const seen = new Set<string>();
  const collected: ImportedQuestion[] = [];

  for (const categoryId of categoryIds) {
    for (let page = 0; page < PAGES_PER_CATEGORY; page++) {
      const results = await fetchCategoryPage(categoryId);
      if (results.length === 0) break; // category exhausted

      for (const r of results) {
        const q = toImportedQuestion(r);
        if (seen.has(q.question)) continue;
        seen.add(q.question);
        collected.push(q);
      }

      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  return collected;
};

async function run() {
  await connectMongo();

  // optional: `npm run import:opentdb -- geography` to import just one genre
  const targetGenre = process.argv[2];
  const entries = Object.entries(GENRE_CATEGORIES).filter(
    ([genre]) => !targetGenre || genre === targetGenre
  );

  if (entries.length === 0) {
    console.error(`❌ Unknown genre "${targetGenre}". Known genres: ${Object.keys(GENRE_CATEGORIES).join(", ")}`);
    process.exit(1);
  }

  for (const [genre, categoryIds] of entries) {
    console.log(`⏳ Fetching "${genre}" from OpenTDB categories [${categoryIds.join(", ")}]…`);
    const imported = await importGenre(categoryIds);

    const existing = await Quiz.findOne({ genre, createdBy: "AI" });
    const existingQuestions = existing?.questions ?? [];
    const existingTexts = new Set(existingQuestions.map((q) => q.question));

    const newOnes = imported.filter((q) => !existingTexts.has(q.question));
    const merged = [...existingQuestions, ...newOnes];

    await Quiz.findOneAndUpdate(
      { genre, createdBy: "AI" },
      {
        $set: {
          title: existing?.title ?? `${genre[0].toUpperCase() + genre.slice(1)} Trivia`,
          description: existing?.description ?? `A growing pool of ${genre} trivia.`,
          genre,
          createdBy: "AI",
          questions: merged,
        },
      },
      { upsert: true }
    );

    console.log(`✅ "${genre}": +${newOnes.length} new (pool now ${merged.length})`);
  }

  await mongoose.connection.close();
  console.log("🌱 Import complete");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
