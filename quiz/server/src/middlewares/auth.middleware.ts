import { Request, Response, NextFunction } from "express";
import { verifyClerkToken } from "../config/clerk";
import { User } from "../models/User.model";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyClerkToken(token);

    const clerkId = payload.sub as string;
    const email =
      typeof payload.email === "string"
        ? payload.email
        : "Anonymous";

    const avatar =
      typeof payload.picture === "string"
        ? payload.picture
        : undefined;

    let user = await User.findOne({ clerkId });

    if (!user) {
      user = await User.create({
        clerkId,
        username: email,
        avatar,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
