import mongoose, { Schema, Document } from "mongoose";

export interface IMatch extends Document {
  roomId: string;
  players: mongoose.Types.ObjectId[];
  winner?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    roomId: { type: String, required: true },
    players: [{ type: Schema.Types.ObjectId, ref: "User" }],
    winner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Match = mongoose.model<IMatch>("Match", MatchSchema);
