import mongoose, { Schema, Document } from "mongoose";

export interface IMatch extends Document {
  matchCode: string;
  players: mongoose.Types.ObjectId[];
  winner?: mongoose.Types.ObjectId;
  scores: Record<string, number>;
  totalQuestions: number;
  createdAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    matchCode: { type: String, required: true, index: true },

    players: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],

    winner: { type: Schema.Types.ObjectId, ref: "User" },

    scores: {
      type: Map,
      of: Number,
      default: {},
    },

    totalQuestions: { type: Number, required: true },
  },
  { timestamps: true }
);

// Helpful indexes
MatchSchema.index({ players: 1 });
MatchSchema.index({ winner: 1 });

export const Match = mongoose.model<IMatch>("Match", MatchSchema);
