import axios, { AxiosInstance } from "axios";

/**
 * Creates an authenticated axios client
 * Token must be passed explicitly
 */
export const createApiClient = (token: string): AxiosInstance => {
  if (!token) {
    throw new Error("API token is required");
  }

  return axios.create({
    baseURL:
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") + "/api" ||
      "http://localhost:4000/api",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },

    timeout: 10000,
  });
};
