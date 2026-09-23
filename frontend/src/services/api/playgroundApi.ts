import { api } from "./client";
import { CodeRunResult } from "./problemApi";

export interface PlaygroundRunRequest {
  code: string;
  input_data?: string;
  timeout_ms?: number;
}

export const playgroundApi = {
  runCode: (code: string, inputData = "", timeoutMs = 3000) => {
    return api.post<CodeRunResult>("/playground/run", {
      code,
      input_data: inputData,
      timeout_ms: timeoutMs,
    });
  },
};
