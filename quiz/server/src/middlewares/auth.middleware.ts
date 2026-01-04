import { Request, Response, NextFunction } from "express";
import { verifyClerkToken } from "../config/clerk";
import { User } from "../models/User.model";
import { IUser } from "../models/User.model";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const payload = await verifyClerkToken(token);

    const clerkId = payload.sub as string;
    console.log("🟢 Auth middleware hit");
console.log("Clerk ID:", clerkId);

    // Safer username fallback
    const email =
      typeof payload.email === "string" ? payload.email : undefined;

    const avatar =
      typeof payload.picture === "string" ? payload.picture : undefined;

    const username =
      email ?? `user_${clerkId.slice(0, 6)}`;

    // 🔒 RACE-SAFE UPSERT
    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        $setOnInsert: {
          clerkId,
          username,
          avatar,
          xp: 0,
          badges: [],
          stats: { wins: 0, matches: 0, accuracy: 0 },
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
