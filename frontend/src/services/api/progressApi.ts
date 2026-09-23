import { api } from "./client";
import { UserProgress } from "../../types";

export const progressApi = {
  getMyProgress: () => {
    return api.get<UserProgress>("/me/progress");
  },
};
