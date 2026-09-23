import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Code,
  Flame,
  ArrowRight,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";
import { courseApi } from "../services/api/courseApi";
import { Course, Difficulty } from "../types";

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [selectedDifficulty]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const diff = selectedDifficulty === "ALL" ? undefined : selectedDifficulty;
      const res = await courseApi.getCourses(1, 50, diff);
      setCourses(res?.items || []);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลหลักสูตรได้");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "EASY":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            EASY
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            MEDIUM
          </span>
        );
      case "HARD":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            HARD
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Python Practice Courses</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            คอร์สและโจทย์เขียนโปรแกรม Python
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            เลือกเรียนรู้ตามระดับความยาก เขียนโค้ด รัน และส่งตรวจกับระบบ Python Sandbox แบบทันที
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedDifficulty === diff
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl glass-panel animate-pulse p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-16 h-6 bg-slate-800 rounded-full" />
                <div className="w-3/4 h-6 bg-slate-800 rounded-lg" />
                <div className="w-full h-12 bg-slate-800/60 rounded-lg" />
              </div>
              <div className="w-full h-10 bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 space-y-4 rounded-2xl glass-panel p-8">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">ยังไม่มีคอร์สในหมวดหมู่นี้</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            ลองปรับเปลี่ยนระดับความยาก หรือเข้าสู่ระบบในฐานะ Admin เพื่อสร้างคอร์สใหม่
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const total = course.totalProblems ?? 0;
            const solved = course.solvedProblems ?? 0;
            const pct = course.progressPercentage ?? (total > 0 ? (solved / total) * 100 : 0);

            return (
              <div
                key={course.id}
                className="rounded-2xl glass-panel glass-panel-hover p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {getDifficultyBadge(course.difficulty)}
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      {total} โจทย์
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors tracking-tight mb-2">
                    {course.title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-6">
                    {course.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">ความคืบหน้า</span>
                      <span className="text-indigo-400 font-bold">
                        {solved}/{total} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Open Course Button */}
                  <Link
                    to={`/courses/${course.id}`}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white text-sm font-semibold transition-all transform active:scale-95 group-hover:bg-indigo-600"
                  >
                    <span>เข้าสู่บทเรียนและโจทย์</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
