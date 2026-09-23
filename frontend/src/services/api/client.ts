import { getIdToken } from "../firebase";
import { ApiResponse } from "../../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

function toCamel(s: string): string {
  return s.replace(/([-_][a-z])/gi, ($1) =>
    $1.toUpperCase().replace("-", "").replace("_", "")
  );
}

/**
 * Recursively maps all snake_case object keys to camelCase,
 * while also retaining the original key so both casing styles work seamlessly.
 */
function keysToCamel(o: any): any {
  if (o === null || o === undefined || typeof o !== "object") {
    return o;
  }
  if (o instanceof Date || o instanceof RegExp || o instanceof Blob || o instanceof File) {
    return o;
  }
  if (Array.isArray(o)) {
    return o.map(keysToCamel);
  }
  return Object.keys(o).reduce((result: any, key: string) => {
    const camelKey = toCamel(key);
    const val = keysToCamel(o[key]);
    result[camelKey] = val;
    if (camelKey !== key) {
      result[key] = val;
    }
    return result;
  }, {});
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});

  // Attach Firebase ID Token if available
  const token = await getIdToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Do not set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let rawData: any;
  try {
    rawData = await response.json();
  } catch (err) {
    throw new ApiError(
      "PARSE_ERROR",
      `Failed to parse response from server (${response.status})`
    );
  }

  if (!response.ok || !rawData.success) {
    const errCode = rawData.error?.code || `HTTP_${response.status}`;
    const errMsg = rawData.error?.message || response.statusText || "Request failed";
    throw new ApiError(errCode, errMsg);
  }

  // Convert snake_case from backend to camelCase + keep snake_case
  const parsedData = keysToCamel(rawData.data);
  return parsedData as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  patch: <T>(endpoint: string, body?: any, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
