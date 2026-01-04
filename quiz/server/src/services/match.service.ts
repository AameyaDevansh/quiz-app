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
