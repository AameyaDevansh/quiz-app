import mongoose, { Schema, Document } from "mongoose";

export interface IQuiz extends Document {
  title: string;
  questions: number;
  createdBy: mongoose.Types.ObjectId;
}

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    questions: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Quiz = mongoose.model<IQuiz>("Quiz", QuizSchema);
