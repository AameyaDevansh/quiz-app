"use client";

import { useAuth, useUser } from "@clerk/nextjs";

/**
 * Unified Clerk hook
 * Keeps auth logic out of components
 */
export const useClerkAuth = () => {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();

  return {
    isLoaded,
    isSignedIn,
    getToken,
    signOut,
    user,
  };
};
