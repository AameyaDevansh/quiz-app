import { Quiz } from "../models/Quiz.model";
import { IUser } from "../models/User.model";

interface CreateQuizInput {
  title: string;
  genre: string;
  questions: {
    question: string;
    options?: string[];
    correctAnswer: string;
    type: "MCQ" | "BLANK";
  }[];
}

export const createQuiz = async (
  data: CreateQuizInput,
  user: IUser
) => {
  return Quiz.create({
    title: data.title,
    genre: data.genre,
    questions: data.questions,
    createdBy: user._id,
  });
};

export const getAllQuizzes = async () => {
  return Quiz.find()
    .populate("createdBy", "username")
    .sort({ createdAt: -1 });
};
