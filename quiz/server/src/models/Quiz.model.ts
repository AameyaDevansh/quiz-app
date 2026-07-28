import mongoose, { Schema, Document } from "mongoose";

interface IQuestion {
  question: string;
  options?: string[];      // for MCQ
  correctAnswer: string;   // text-based works for MCQ & blanks
  type: "MCQ" | "BLANK";
  timeLimit: number;       // seconds this question stays live
  points: number;          // base points for a correct answer
}

export interface IQuiz extends Document {
  title: string;
  description?: string;
  genre: string;
  questions: IQuestion[];
  createdBy: mongoose.Types.ObjectId | "AI";
}

const QuestionSchema = new Schema<IQuestion>(
  {
    question: { type: String, required: true },
    options: { type: [String] },
    correctAnswer: { type: String, required: true },
    type: { type: String, enum: ["MCQ", "BLANK"], required: true },
    timeLimit: { type: Number, default: 20 },
    points: { type: Number, default: 1000 },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    description: { type: String },
    genre: { type: String, required: true, index: true },

    questions: {
      type: [QuestionSchema],
      required: true,
    },

    createdBy: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export const Quiz = mongoose.model<IQuiz>("Quiz", QuizSchema);
