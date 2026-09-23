export type UserRole = "USER" | "ADMIN";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type SubmissionStatus =
  | "PENDING"
  | "RUNNING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT"
  | "MEMORY_LIMIT"
  | "RUNTIME_ERROR"
  | "SYSTEM_ERROR";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string | null;
  difficulty: Difficulty;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  totalProblems?: number;
  solvedProblems?: number;
  progressPercentage?: number;
}

export interface ProblemListItem {
  id: number;
  courseId: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  points: number;
  isPublished: boolean;
  isSolved: boolean;
  isStarred: boolean;
}

export interface CourseDetail extends Course {
  problems: ProblemListItem[];
}

export interface SampleTestCase {
  id: number;
  inputData: string;
  expectedOutput: string;
}

export interface TestCase {
  id: number;
  problemId: number;
  inputData: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface Problem {
  id: number;
  courseId: number;
  title: string;
  slug: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  constraintsText?: string | null;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  sampleTestCases: SampleTestCase[];
  isSolved: boolean;
  isStarred: boolean;
}

export interface ProblemAdminItem extends Problem {
  testCasesCount: number;
}

export interface Submission {
  id: number;
  userId: number;
  problemId: number;
  problemTitle?: string | null;
  language: string;
  status: SubmissionStatus;
  score: number;
  executionTimeMs?: number | null;
  memoryUsedMb?: number | null;
  errorCode?: string | null;
  code?: string | null;
  passedTestCases?: number;
  totalTestCases?: number;
  passed_test_cases?: number;
  total_test_cases?: number;
  createdAt: string;
}

export interface UserProgress {
  totalPoints: number;
  solvedProblems: number;
  starredProblems: number;
}

export interface CourseProgress {
  courseId: number;
  totalProblems: number;
  solvedProblems: number;
  percentage: number;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
