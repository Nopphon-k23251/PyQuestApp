import { api } from "./client";
import { Course, CourseDetail, PaginatedResponse, CourseProgress } from "../../types";

export const courseApi = {
  getCourses: (page = 1, pageSize = 20, difficulty?: string) => {
    let url = `/courses?page=${page}&page_size=${pageSize}`;
    if (difficulty) url += `&difficulty=${difficulty}`;
    return api.get<PaginatedResponse<Course>>(url);
  },

  getCourseDetail: (courseId: number) => {
    return api.get<CourseDetail>(`/courses/${courseId}`);
  },

  getCourseProgress: (courseId: number) => {
    return api.get<CourseProgress>(`/courses/${courseId}/progress`);
  },
};
