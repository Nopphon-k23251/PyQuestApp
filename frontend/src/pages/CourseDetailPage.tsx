import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Star,
  ArrowLeft,
  ArrowRight,
  Flame,
  Award,
  Clock,
  Sparkles,
  Layers,
  Filter,
} from "lucide-react";
import { courseApi } from "../services/api/courseApi";
import { problemApi } from "../services/api/problemApi";
import { useAuth } from "../features/auth/AuthContext";
import { CourseDetail, ProblemListItem, Difficulty } from "../types";

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseDetail(parseInt(courseId));
    }
  }, [courseId]);

  const loadCourseDetail = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseApi.getCourseDetail(id);
      setCourse(data);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลคอร์สได้");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (problemId: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const problems = course?.problems || (course as any)?.problemList || [];
      const prob = problems.find((p: any) => p.id === problemId);
      if (!prob) return;

      const isStarred = prob.isStarred ?? (prob as any).is_starred;
      if (isStarred) {
        await problemApi.unstarProblem(problemId);
      } else {
        await problemApi.starProblem(problemId);
      }

      setCourse((prev) => {
        if (!prev) return null;
        const currentProbs = prev.problems || (prev as any).problemList || [];
        return {
          ...prev,
          problems: currentProbs.map((p: any) =>
            p.id === problemId ? { ...p, isStarred: !isStarred, is_starred: !isStarred } : p
          ),
        };
      });
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="h-48 glass-panel rounded-2xl" />
        <div className="h-64 glass-panel rounded-2xl" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">ไม่พบข้อมูลคอร์ส</h2>
        <p className="text-sm text-slate-400">{error}</p>
        <Link
          to="/courses"
          className="inline-flex items-center space-x-2 text-indigo-400 hover:underline text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปหน้ารวมคอร์ส</span>
        </Link>
      </div>
    );
  }

  const TOPIC_LIST = [
    "พื้นฐานและตัวแปร",
    "เงื่อนไขและการตัดสินใจ",
    "การวนซ้ำและการทำซ้ำ",
    "ข้อความและสตริงเมธอด",
    "ลิสต์และลิสต์เมธอด",
    "ดิกชันนารีและคู่ข้อมูล",
    "การสร้างและใช้งานฟังก์ชัน",
    "แบบฝึกหัดทบทวนและโจทย์ประยุกต์",
  ];

  const [selectedTopic, setSelectedTopic] = useState<string>("ALL");

  const problemsList: ProblemListItem[] = course.problems || (course as any).problemList || [];
  const total = course.totalProblems ?? (course as any).total_problems ?? problemsList.length;
  const solved = course.solvedProblems ?? (course as any).solved_problems ?? problemsList.filter((p: any) => p.isSolved || p.is_solved).length;
  const pct = total > 0 ? (solved / total) * 100 : 0;

  const topicStats = useMemo(() => {
    const stats: Record<string, { total: number; solved: number }> = {};
    TOPIC_LIST.forEach((t) => {
      stats[t] = { total: 0, solved: 0 };
    });

    problemsList.forEach((p: any) => {
      const t = p.topic || "ทั่วไป";
      if (!stats[t]) {
        stats[t] = { total: 0, solved: 0 };
      }
      stats[t].total += 1;
      if (p.isSolved || p.is_solved) {
        stats[t].solved += 1;
      }
    });
    return stats;
  }, [problemsList]);

  const visibleTopics = useMemo(() => {
    if (selectedTopic !== "ALL") {
      return [selectedTopic];
    }
    return TOPIC_LIST.filter((t) => (topicStats[t]?.total ?? 0) > 0);
  }, [selectedTopic, topicStats]);

  const getDifficultyBadge = (diff: string) => {
    switch (diff?.toUpperCase()) {
      case "EASY":
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            EASY
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            MEDIUM
          </span>
        );
      case "HARD":
        return (
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            HARD
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ารายการคอร์ส</span>
        </Link>
      </div>

      {/* Course Header Banner */}
      <div className="rounded-2xl glass-panel p-8 border border-white/10 relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {course.slug === "python-fundamentals"
                  ? "ครบทุกระดับ (EASY - HARD)"
                  : course.difficulty}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                8 หมวดหมู่ • {total} ข้อโจทย์
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {course.title}
            </h1>
          </div>

          {/* Progress Summary Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-right min-w-[160px]">
            <span className="text-xs text-slate-400 block mb-1">ความคืบหน้ารวม</span>
            <div className="text-2xl font-bold text-white">
              {solved} / {total}
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          {course.description}
        </p>
      </div>

      {/* Topic Filter Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>เลือกดูตามหัวข้อการเรียนรู้</span>
          </div>
          <span className="text-xs text-slate-400">
            สำเร็จแล้ว {solved} จาก {total} ข้อ
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedTopic("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTopic === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "glass-panel text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            ทั้งหมด ({total} ข้อ)
          </button>
          {TOPIC_LIST.map((topic) => {
            const tStat = topicStats[topic] || { total: 0, solved: 0 };
            if (tStat.total === 0) return null;
            const isSelected = selectedTopic === topic;
            return (
              <button
                type="button"
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "glass-panel text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <span>{topic}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tStat.solved}/{tStat.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Problems by Topic */}
      {problemsList.length === 0 ? (
        <div className="p-8 rounded-2xl glass-panel text-center text-slate-400 text-sm">
          ยังไม่มีโจทย์ที่เผยแพร่ในคอร์สนี้
        </div>
      ) : (
        <div className="space-y-8">
          {visibleTopics.map((topic) => {
            const topicProblems = problemsList.filter(
              (p: any) => (p.topic || "ทั่วไป") === topic
            );
            if (topicProblems.length === 0) return null;
            const tStat = topicStats[topic] || { total: topicProblems.length, solved: 0 };
            const tPct = tStat.total > 0 ? (tStat.solved / tStat.total) * 100 : 0;

            return (
              <div key={topic} className="space-y-3">
                {/* Topic Header without number prefix */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {topic}
                    </h3>
                    <span className="text-xs text-slate-400 font-normal">
                      ({topicProblems.length} ข้อ)
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-400">
                      ผ่านแล้ว{" "}
                      <span className="text-emerald-400 font-semibold">
                        {tStat.solved}
                      </span>
                      /{tStat.total} ข้อ
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${tPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Problem Cards */}
                <div className="space-y-2.5">
                  {topicProblems.map((problem: any) => {
                    const globalIndex =
                      problemsList.findIndex((p: any) => p.id === problem.id) + 1;
                    const isSolved = problem.isSolved ?? problem.is_solved ?? false;
                    const isStarred = problem.isStarred ?? problem.is_starred ?? false;

                    return (
                      <div
                        key={problem.id}
                        className="flex items-center justify-between p-4 rounded-xl glass-panel glass-panel-hover border border-white/5 transition-all group"
                      >
                        <div className="flex items-center space-x-4 min-w-0">
                          {/* Status Indicator */}
                          <div>
                            {isSolved ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-600 shrink-0" />
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-mono text-slate-500 shrink-0">
                                #{globalIndex}
                              </span>
                              <Link
                                to={`/problems/${problem.id}`}
                                className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors truncate"
                              >
                                {problem.title}
                              </Link>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                              {getDifficultyBadge(problem.difficulty)}
                              <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-slate-400 border border-white/5">
                                {problem.topic || "ทั่วไป"}
                              </span>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold">
                                +{problem.points} คะแนน
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0 ml-3">
                          {/* Star Toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(problem.id, e)}
                            title={isStarred ? "ยกเลิกติดดาว" : "ติดดาวโจทย์นี้"}
                            className={`p-2 rounded-lg transition-colors ${
                              isStarred
                                ? "text-amber-400 bg-amber-500/10"
                                : "text-slate-500 hover:text-amber-400 hover:bg-slate-800"
                            }`}
                          >
                            <Star
                              className={`w-4 h-4 ${isStarred ? "fill-amber-400" : ""}`}
                            />
                          </button>

                          {/* Solve Button */}
                          <Link
                            to={`/problems/${problem.id}`}
                            className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all transform active:scale-95 ${
                              isSolved
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                            }`}
                          >
                            <span>{isSolved ? "ทำซ้ำ (Review)" : "เริ่มทำโจทย์"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
