import { api } from "./client";
import { User } from "../../types";

export const authApi = {
  syncUser: (username: string) => {
    return api.post<{ user: User }>("/auth/sync", { username });
  },

  getMe: () => {
    return api.get<User>("/auth/me");
  },
};
