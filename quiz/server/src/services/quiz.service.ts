import { Quiz } from "../models/Quiz.model";
import { IUser } from "../models/User.model";

export const createQuiz = async (
  title: string,
  questions: number,
  user: IUser
) => {
  return Quiz.create({
    title,
    questions,
    createdBy: user._id,
  });
};

export const getAllQuizzes = async () => {
  return Quiz.find().populate("createdBy", "username");
};
