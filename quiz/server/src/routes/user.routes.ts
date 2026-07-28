import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { getMe } from "../services/user.service";
import { getMatchHistory } from "../services/match.service";

const router = Router();

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json(getMe(req.user));
});

router.get("/me/matches", authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const matches = await getMatchHistory(req.user._id as any);
  res.json(matches);
});

export default router;
