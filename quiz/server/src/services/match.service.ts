import mongoose from "mongoose";
import { Match } from "../models/Match.model";

interface CreateMatchInput {
  matchCode: string;
  players: mongoose.Types.ObjectId[];
  winner?: mongoose.Types.ObjectId;
  scores: Record<string, number>;
  totalQuestions: number;
}

export const createMatch = async (data: CreateMatchInput) => {
  return Match.create(data);
};

export const getMatchHistory = async (userId: mongoose.Types.ObjectId) => {
  const matches = await Match.find({ players: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("players", "username avatar")
    .populate("winner", "username avatar");

  // Mongoose Map fields don't survive JSON.stringify as plain objects —
  // convert explicitly so API consumers get a normal {clerkId: score} shape.
  return matches.map((m) => ({
    ...m.toObject(),
    scores: Object.fromEntries(m.scores),
  }));
};
