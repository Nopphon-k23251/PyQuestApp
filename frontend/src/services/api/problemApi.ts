import { api } from "./client";
import { Problem, SubmissionStatus } from "../../types";

export interface CodeRunResult {
  status: SubmissionStatus;
  stdout: string;
  stderr: string;
  execution_time_ms: number;
}

export interface SubmitResult {
  submission_id: number;
  status: SubmissionStatus;
}

export const problemApi = {
  getProblem: (problemId: number) => {
    return api.get<Problem>(`/problems/${problemId}`);
  },

  runCode: (problemId: number, code: string, inputData = "") => {
    return api.post<CodeRunResult>(`/problems/${problemId}/run`, {
      code,
      input_data: inputData,
    });
  },

  submitCode: (problemId: number, code: string) => {
    return api.post<SubmitResult>(`/problems/${problemId}/submit`, { code });
  },

  submitFile: (problemId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<SubmitResult>(`/problems/${problemId}/submit`, formData);
  },

  starProblem: (problemId: number) => {
    return api.post<{ problem_id: number; is_starred: boolean }>(
      `/problems/${problemId}/star`
    );
  },

  unstarProblem: (problemId: number) => {
    return api.delete<{ problem_id: number; is_starred: boolean }>(
      `/problems/${problemId}/star`
    );
  },
};
