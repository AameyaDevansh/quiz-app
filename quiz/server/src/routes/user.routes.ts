import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middlewares/auth.middleware";
import { getMe } from "../services/user.service";

const router = Router();

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  res.json(getMe(req.user));
});

export default router;
