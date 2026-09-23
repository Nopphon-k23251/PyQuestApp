import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { CoursesPage } from "../pages/CoursesPage";
import { CourseDetailPage } from "../pages/CourseDetailPage";
import { ProblemPage } from "../pages/ProblemPage";
import { DashboardPage } from "../pages/DashboardPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { PlaygroundPage } from "../pages/PlaygroundPage";

import { ErrorBoundary } from "../components/layout/ErrorBoundary";

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const hasDevToken = Boolean(localStorage.getItem("pyquest_dev_token"));

  if (loading && !hasDevToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user && !hasDevToken) {
    return <Navigate to="/login" replace />;
  }
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

// Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const isDevAdmin = localStorage.getItem("pyquest_dev_token") === "dev_admin_token";

  if (loading && !isDevAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  const role = (user?.role || "").toUpperCase();
  if (!isDevAdmin && (!user || role !== "ADMIN")) {
    return <Navigate to="/courses" replace />;
  }
  return <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการโหลดหน้า Admin">{children}</ErrorBoundary>;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/courses" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      <Route path="/problems/:problemId" element={<ProblemPage />} />
      <Route
        path="/playground"
        element={
          <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในหน้า Playground">
            <PlaygroundPage />
          </ErrorBoundary>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  );
};
