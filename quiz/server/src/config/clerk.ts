import { verifyToken } from "@clerk/backend";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is not defined");
}

export const verifyClerkToken = async (token: string) => {
  return verifyToken(token, {
    secretKey: CLERK_SECRET_KEY,
  });
};
