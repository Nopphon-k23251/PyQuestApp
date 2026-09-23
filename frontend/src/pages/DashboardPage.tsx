import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  CheckCircle2,
  Star,
  BookOpen,
  ArrowRight,
  Clock,
  Terminal,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { progressApi } from "../services/api/progressApi";
import { submissionApi } from "../services/api/submissionApi";
import { courseApi } from "../services/api/courseApi";
import { UserProgress, Submission, Course } from "../types";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [progData, subData, courseData] = await Promise.all([
        progressApi.getMyProgress(),
        submissionApi.getMySubmissions(undefined, undefined, 1, 10),
        courseApi.getCourses(1, 6),
      ]);
      setProgress(progData || null);
      setSubmissions(subData?.items || []);
      setCourses(courseData?.items || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setSubmissions([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl glass-panel p-8 border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Developer Progress Dashboard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            สวัสดี, {user?.username} 👋
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            ยินดีต้อนรับสู่แดชบอร์ดฝึกเขียนโปรแกรมภาษา Python ติดตามผลงาน คะแนนสะสม และประวัติการทำโจทย์ของคุณ
          </p>
        </div>

        <Link
          to="/courses"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95 shrink-0"
        >
          <BookOpen className="w-4 h-4" />
          <span>ดูคอร์สทั้งหมด</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl glass-panel border border-amber-500/20 flex items-center space-x-4">
          <div className="p-4 rounded-xl bg-amber-500/10 text-amber-400">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-0.5">
              คะแนนสะสมทั้งหมด (Total Points)
            </span>
            <span className="text-2xl font-extrabold text-white">
              {progress?.totalPoints ?? (progress as any)?.total_points ?? 0}
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-emerald-500/20 flex items-center space-x-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-0.5">
              โจทย์ที่แก้สำเร็จ (Solved Problems)
            </span>
            <span className="text-2xl font-extrabold text-white">
              {progress?.solvedProblems ?? (progress as any)?.solved_problems ?? 0} ข้อ
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-indigo-500/20 flex items-center space-x-4">
          <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Star className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-0.5">
              โจทย์ที่ติดดาวไว้ (Starred)
            </span>
            <span className="text-2xl font-extrabold text-white">
              {progress?.starredProblems ?? (progress as any)?.starred_problems ?? 0} ข้อ
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Submissions & In-Progress Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Submissions */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>ประวัติการส่งล่าสุด (Recent Submissions)</span>
          </h2>

          <div className="rounded-2xl glass-panel border border-white/5 overflow-hidden">
            {(!submissions || submissions.length === 0) ? (
              <div className="p-8 text-center text-sm text-slate-400">
                ยังไม่มีประวัติการส่งคำตอบ
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {submissions.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          sub.status === "ACCEPTED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {sub.status === "ACCEPTED" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <Link
                          to={`/problems/${sub.problemId || sub.problem_id}`}
                          className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors block"
                        >
                          {sub.problemTitle || sub.problem_title || `โจทย์ #${sub.problemId || sub.problem_id}`}
                        </Link>
                        <span className="text-xs text-slate-500">
                          {sub.createdAt || sub.created_at ? new Date(sub.createdAt || sub.created_at).toLocaleString() : "-"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          sub.status === "ACCEPTED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {sub.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-300 block mt-1">
                        +{sub.score} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Continue Learning */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>หลักสูตรแนะนำ (Recommended Courses)</span>
          </h2>

          <div className="space-y-3">
            {courses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="p-5 rounded-2xl glass-panel glass-panel-hover border border-white/5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {course.difficulty}
                  </span>
                  <span className="text-xs text-slate-400">
                    {course.totalProblems ?? 0} ข้อ
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {course.description}
                </p>

                <Link
                  to={`/courses/${course.id}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 pt-1"
                >
                  <span>เข้าสู่คอร์สนี้</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
