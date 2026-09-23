import { api } from "./client";
import {
  Course,
  ProblemAdminItem,
  TestCase,
  Submission,
  PaginatedResponse,
} from "../../types";

export const adminApi = {
  // Course Admin
  listCourses: (page = 1, pageSize = 50) => {
    return api.get<PaginatedResponse<Course>>(
      `/admin/courses?page=${page}&page_size=${pageSize}`
    );
  },

  createCourse: (data: Partial<Course>) => {
    return api.post<Course>("/admin/courses", data);
  },

  updateCourse: (courseId: number, data: Partial<Course>) => {
    return api.patch<Course>(`/admin/courses/${courseId}`, data);
  },

  deleteCourse: (courseId: number) => {
    return api.delete<{ message: string }>(`/admin/courses/${courseId}`);
  },

  // Problem Admin
  listProblems: (courseId?: number) => {
    let url = "/admin/problems";
    if (courseId) url += `?course_id=${courseId}`;
    return api.get<ProblemAdminItem[]>(url);
  },

  createProblem: (data: any) => {
    return api.post<ProblemAdminItem>("/admin/problems", data);
  },

  updateProblem: (problemId: number, data: any) => {
    return api.patch<ProblemAdminItem>(`/admin/problems/${problemId}`, data);
  },

  deleteProblem: (problemId: number) => {
    return api.delete<{ message: string }>(`/admin/problems/${problemId}`);
  },

  // Test Case Admin
  getTestCases: (problemId: number) => {
    return api.get<TestCase[]>(`/admin/problems/${problemId}/test-cases`);
  },

  createTestCase: (problemId: number, data: any) => {
    return api.post<TestCase>(`/admin/problems/${problemId}/test-cases`, data);
  },

  updateTestCase: (testCaseId: number, data: any) => {
    return api.patch<TestCase>(`/admin/test-cases/${testCaseId}`, data);
  },

  deleteTestCase: (testCaseId: number) => {
    return api.delete<{ message: string }>(`/admin/test-cases/${testCaseId}`);
  },

  // Submissions Inspection
  inspectSubmissions: (page = 1, pageSize = 20, problemId?: number, status?: string) => {
    let url = `/admin/submissions?page=${page}&page_size=${pageSize}`;
    if (problemId) url += `&problem_id=${problemId}`;
    if (status) url += `&status=${status}`;
    return api.get<PaginatedResponse<Submission>>(url);
  },
};
