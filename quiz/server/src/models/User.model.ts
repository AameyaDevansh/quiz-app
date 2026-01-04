import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  username: string;
  avatar?: string;
  xp: number;
  badges: string[];
  stats: {
    wins: number;
    matches: number;
    accuracy: number;
  };
  createdAt: Date;
  updatedAt: Date;
}


const UserSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    username: { type: String, required: true },

    avatar: String,

    xp: { type: Number, default: 0 },

    badges: { type: [String], default: [] },

    stats: {
      wins: { type: Number, default: 0 },
      matches: { type: Number, default: 0 },
      accuracy: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
