import { api } from "./client";
import { Submission, PaginatedResponse } from "../../types";

export const submissionApi = {
  getSubmission: (submissionId: number) => {
    return api.get<Submission>(`/submissions/${submissionId}`);
  },

  getMySubmissions: (problemId?: number, status?: string, page = 1, pageSize = 20) => {
    let url = `/me/submissions?page=${page}&page_size=${pageSize}`;
    if (problemId) url += `&problem_id=${problemId}`;
    if (status) url += `&status=${status}`;
    return api.get<PaginatedResponse<Submission>>(url);
  },
};
