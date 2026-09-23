import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Code2,
  Terminal,
  Trophy,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { progressApi } from "../../services/api/progressApi";
import { UserProgress } from "../../types";

export const Navbar: React.FC = () => {
  const { user, logout, loginDev } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    if (user) {
      progressApi.getMyProgress()
        .then(setProgress)
        .catch(() => {});
    } else {
      setProgress(null);
    }
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#07090e]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                PyQuest
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">
                  v1.0
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium -mt-1">
                Python Practice Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/courses"
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/courses")
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>หลักสูตร (Courses)</span>
            </Link>

            <Link
              to="/playground"
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/playground")
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>สนามทดลอง (Playground)</span>
            </Link>

            {user && (
              <Link
                to="/dashboard"
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Terminal className="w-4 h-4" />
                <span>แดชบอร์ด (Dashboard)</span>
              </Link>
            )}

            {user?.role === "ADMIN" && (
              <Link
                to="/admin"
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith("/admin")
                    ? "bg-rose-500/15 text-rose-300 border border-rose-500/20"
                    : "text-rose-400/90 hover:text-rose-200 hover:bg-rose-500/10"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>จัดการระบบ (Admin)</span>
              </Link>
            )}
          </nav>
        </div>

        {/* User Status & Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Points Badge */}
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">
                  {progress?.totalPoints ?? (progress as any)?.total_points ?? 0} pts
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-xs text-slate-400 font-medium">
                  {progress?.solvedProblems ?? (progress as any)?.solved_problems ?? 0} ผ่าน
                </span>
              </div>

              {/* Profile Dropdown / User Info */}
              <div className="flex items-center space-x-2 pl-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">
                    {user?.username || "Student"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {user?.role || "USER"}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                  {(user?.username || "U").charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              {/* Quick Dev Switcher */}
              <div className="hidden lg:flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                <span className="text-slate-500 text-[11px]">Dev:</span>
                <button
                  onClick={() => loginDev("student")}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                >
                  Student
                </button>
                <button
                  onClick={() => loginDev("admin")}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                >
                  Admin
                </button>
              </div>

              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>สมัครสมาชิก</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
