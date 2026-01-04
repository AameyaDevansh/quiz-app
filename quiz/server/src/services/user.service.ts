import { IUser } from "../models/User.model";

export const getMe = (user: IUser) => {
  return {
    id: user._id,
    clerkId: user.clerkId,
    username: user.username,
    avatar: user.avatar,
    xp: user.xp,
    badges: user.badges,
    stats: user.stats,
    createdAt: user.createdAt,
  };
};
