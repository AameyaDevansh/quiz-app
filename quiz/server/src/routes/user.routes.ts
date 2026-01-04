import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { getMe } from "../services/user.service";

const router = Router();

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json(getMe(req.user));
});

export default router;
