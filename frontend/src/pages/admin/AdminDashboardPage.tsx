import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  BookOpen,
  Code2,
  ListOrdered,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  FileCode,
  Sparkles,
} from "lucide-react";
import { adminApi } from "../../services/api/adminApi";
import { courseApi } from "../../services/api/courseApi";
import {
  Course,
  ProblemAdminItem,
  TestCase,
  Submission,
  Difficulty,
} from "../../types";

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"courses" | "problems" | "testcases" | "submissions">("courses");

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [problems, setProblems] = useState<ProblemAdminItem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
    difficulty: "EASY" as Difficulty,
    is_published: false,
  });

  const [problemModalOpen, setProblemModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<ProblemAdminItem | null>(null);
  const [problemForm, setProblemForm] = useState({
    course_id: 1,
    title: "",
    slug: "",
    description: "",
    input_description: "",
    output_description: "",
    constraints_text: "",
    difficulty: "EASY" as Difficulty,
    points: 10,
    time_limit_ms: 1000,
    memory_limit_mb: 128,
    is_published: false,
  });

  const [tcModalOpen, setTcModalOpen] = useState(false);
  const [tcForm, setTcForm] = useState({
    input_data: "",
    expected_output: "",
    is_hidden: true,
    points: 5,
  });

  const [codeViewerModal, setCodeViewerModal] = useState<Submission | null>(null);

  useEffect(() => {
    loadAllAdminData();
  }, [activeTab]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === "courses") {
        const cRes = await adminApi.listCourses(1, 100);
        setCourses(cRes?.items || []);
      } else if (activeTab === "problems") {
        const pRes = await adminApi.listProblems();
        setProblems(Array.isArray(pRes) ? pRes : (pRes as any)?.items || []);
      } else if (activeTab === "testcases" && selectedProblemId) {
        const tcRes = await adminApi.getTestCases(selectedProblemId);
        setTestCases(Array.isArray(tcRes) ? tcRes : []);
      } else if (activeTab === "submissions") {
        const sRes = await adminApi.inspectSubmissions(1, 50);
        setSubmissions(sRes?.items || []);
      }
    } catch (err) {
      console.error("Admin data load error:", err);
      setCourses([]);
      setProblems([]);
      setTestCases([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Course handlers ---
  const handleOpenCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title,
        slug: course.slug,
        description: course.description,
        difficulty: course.difficulty,
        is_published: course.isPublished,
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: "",
        slug: "",
        description: "",
        difficulty: "EASY",
        is_published: false,
      });
    }
    setCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await adminApi.updateCourse(editingCourse.id, courseForm);
      } else {
        await adminApi.createCourse(courseForm);
      }
      setCourseModalOpen(false);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to save course");
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("ต้องการลบคอร์สนี้ใช่หรือไม่?")) return;
    try {
      await adminApi.deleteCourse(id);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to delete course");
    }
  };

  // --- Problem handlers ---
  const handleOpenProblemModal = (problem?: ProblemAdminItem) => {
    if (problem) {
      setEditingProblem(problem);
      setProblemForm({
        course_id: problem.courseId,
        title: problem.title,
        slug: problem.slug,
        description: problem.description,
        input_description: problem.inputDescription,
        output_description: problem.outputDescription,
        constraints_text: problem.constraintsText || "",
        difficulty: problem.difficulty,
        points: problem.points,
        time_limit_ms: problem.timeLimitMs,
        memory_limit_mb: problem.memoryLimitMb,
        is_published: problem.isPublished,
      });
    } else {
      setEditingProblem(null);
      setProblemForm({
        course_id: courses[0]?.id || 1,
        title: "",
        slug: "",
        description: "",
        input_description: "",
        output_description: "",
        constraints_text: "",
        difficulty: "EASY",
        points: 10,
        time_limit_ms: 1000,
        memory_limit_mb: 128,
        is_published: false,
      });
    }
    setProblemModalOpen(true);
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProblem) {
        await adminApi.updateProblem(editingProblem.id, problemForm);
      } else {
        await adminApi.createProblem(problemForm);
      }
      setProblemModalOpen(false);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to save problem");
    }
  };

  const handleDeleteProblem = async (id: number) => {
    if (!confirm("ต้องการลบโจทย์นี้ใช่หรือไม่?")) return;
    try {
      await adminApi.deleteProblem(id);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to delete problem");
    }
  };

  // --- Test Case handlers ---
  const handleSelectProblemForTestCases = async (probId: number) => {
    setSelectedProblemId(probId);
    setActiveTab("testcases");
    try {
      const tcRes = await adminApi.getTestCases(probId);
      setTestCases(tcRes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProblemId) return;
    try {
      await adminApi.createTestCase(selectedProblemId, tcForm);
      setTcModalOpen(false);
      setTcForm({ input_data: "", expected_output: "", is_hidden: true, points: 5 });
      const updated = await adminApi.getTestCases(selectedProblemId);
      setTestCases(updated);
    } catch (err: any) {
      alert(err.message || "Failed to save testcase");
    }
  };

  const handleDeleteTestCase = async (tcId: number) => {
    if (!confirm("ต้องการลบ Test Case นี้ใช่หรือไม่?")) return;
    try {
      await adminApi.deleteTestCase(tcId);
      if (selectedProblemId) {
        const updated = await adminApi.getTestCases(selectedProblemId);
        setTestCases(updated);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete testcase");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Administrative Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            แผงควบคุมระบบ (Admin Panel)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            จัดการคอร์ส, สร้างโจทย์, กำหนด Test Cases (Hidden/Sample) และตรวจสอบ Submissions
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "courses"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            คอร์ส (Courses)
          </button>
          <button
            onClick={() => setActiveTab("problems")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "problems"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            โจทย์ (Problems)
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "submissions"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Submissions
          </button>
        </div>
      </div>

      {/* TAB 1: COURSES MANAGEMENT */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>จัดการคอร์สทั้งหมด ({courses.length})</span>
            </h2>
            <button
              onClick={() => handleOpenCourseModal()}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มคอร์สใหม่</span>
            </button>
          </div>

          <div className="rounded-2xl glass-panel border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {courses.map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white">
                        {c.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400">
                        /{c.slug}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                        {c.difficulty}
                      </span>
                      {c.isPublished ? (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          เผยแพร่แล้ว
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          ฉบับร่าง (Draft)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 max-w-2xl">
                      {c.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenCourseModal(c)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="แก้ไขคอร์ส"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="ลบคอร์ส"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROBLEMS MANAGEMENT */}
      {activeTab === "problems" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <span>จัดการโจทย์ทั้งหมด ({problems.length})</span>
            </h2>
            <button
              onClick={() => handleOpenProblemModal()}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มโจทย์ใหม่</span>
            </button>
          </div>

          <div className="rounded-2xl glass-panel border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {problems.map((p) => (
                <div
                  key={p.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white">
                        {p.title}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400">
                        /{p.slug}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                        {p.difficulty}
                      </span>
                      <span className="text-xs font-semibold text-amber-400">
                        +{p.points} pts
                      </span>
                      {p.isPublished ? (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                          Published
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>⏱️ {p.timeLimitMs}ms</span>
                      <span>💾 {p.memoryLimitMb}MB</span>
                      <span className="text-indigo-400 font-semibold">
                        🧪 {p.testCasesCount} Test Cases
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSelectProblemForTestCases(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold transition-colors border border-indigo-500/30"
                    >
                      จัดการ Test Cases ({p.testCasesCount})
                    </button>
                    <button
                      onClick={() => handleOpenProblemModal(p)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProblem(p.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEST CASES MANAGEMENT */}
      {activeTab === "testcases" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => setActiveTab("problems")}
                className="text-xs font-semibold text-indigo-400 hover:underline mb-1"
              >
                ← กลับหน้ารายการโจทย์
              </button>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-indigo-400" />
                <span>Test Cases สำหรับโจทย์ #{selectedProblemId}</span>
              </h2>
            </div>

            <button
              onClick={() => setTcModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่ม Test Case</span>
            </button>
          </div>

          <div className="rounded-2xl glass-panel border border-white/5 overflow-hidden">
            {testCases.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                ยังไม่มี Test Case สำหรับโจทย์นี้
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {testCases.map((tc, idx) => (
                  <div key={tc.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">
                          Test Case #{idx + 1}
                        </span>
                        {tc.isHidden ? (
                          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <EyeOff className="w-3 h-3" />
                            Hidden (ซ่อนไว้สำหรับตรวจ)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Eye className="w-3 h-3" />
                            Sample (แสดงเป็นตัวอย่าง)
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          ({tc.points} pts)
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteTestCase(tc.id)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                        title="ลบ Test Case"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px] block font-sans">
                          Input:
                        </span>
                        <pre className="p-2 rounded bg-black/40 text-emerald-300 overflow-x-auto">
                          {tc.inputData || "(ไม่มี input)"}
                        </pre>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-sans">
                          Expected Output:
                        </span>
                        <pre className="p-2 rounded bg-black/40 text-indigo-300 overflow-x-auto">
                          {tc.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SUBMISSIONS AUDIT */}
      {activeTab === "submissions" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>ประวัติการส่งคำตอบทั้งหมดในระบบ (Submissions Audit)</span>
          </h2>

          <div className="rounded-2xl glass-panel border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        sub.status === "ACCEPTED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {sub.status}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        {sub.problemTitle || `โจทย์ #${sub.problemId}`} (User #{sub.userId})
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(sub.createdAt).toLocaleString()} • {sub.executionTimeMs ?? 0} ms
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-300">
                      {sub.score} pts
                    </span>
                    <button
                      onClick={() => setCodeViewerModal(sub)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                    >
                      ดูโค้ด Python
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Course Edit/Create Modal */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel bg-[#0d121f] border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingCourse ? "แก้ไขคอร์ส" : "เพิ่มคอร์สใหม่"}
            </h3>

            <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">ชื่อคอร์ส (Title)</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Slug (URL friendly)</label>
                <input
                  type="text"
                  required
                  value={courseForm.slug}
                  onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">ระดับความยาก (Difficulty)</label>
                <select
                  value={courseForm.difficulty}
                  onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value as Difficulty })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">คำอธิบาย (Description)</label>
                <textarea
                  required
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="course_pub"
                  checked={courseForm.is_published}
                  onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="course_pub" className="text-slate-300">
                  เผยแพร่ทันที (Published)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                >
                  บันทึกคอร์ส
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Problem Edit/Create Modal */}
      {problemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl p-6 rounded-2xl glass-panel bg-[#0d121f] border border-white/10 space-y-4 my-8">
            <h3 className="text-lg font-bold text-white">
              {editingProblem ? "แก้ไขโจทย์" : "เพิ่มโจทย์ใหม่"}
            </h3>

            <form onSubmit={handleSaveProblem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">คอร์สที่สังกัด</label>
                  <select
                    value={problemForm.course_id}
                    onChange={(e) => setProblemForm({ ...problemForm, course_id: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">ชื่อโจทย์ (Title)</label>
                  <input
                    type="text"
                    required
                    value={problemForm.title}
                    onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Slug</label>
                  <input
                    type="text"
                    required
                    value={problemForm.slug}
                    onChange={(e) => setProblemForm({ ...problemForm, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Difficulty</label>
                  <select
                    value={problemForm.difficulty}
                    onChange={(e) => setProblemForm({ ...problemForm, difficulty: e.target.value as Difficulty })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">คะแนน (Points)</label>
                  <input
                    type="number"
                    required
                    value={problemForm.points}
                    onChange={(e) => setProblemForm({ ...problemForm, points: parseInt(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">คำอธิบายโจทย์ (Description)</label>
                <textarea
                  required
                  rows={3}
                  value={problemForm.description}
                  onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Input Description</label>
                  <textarea
                    required
                    rows={2}
                    value={problemForm.input_description}
                    onChange={(e) => setProblemForm({ ...problemForm, input_description: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Output Description</label>
                  <textarea
                    required
                    rows={2}
                    value={problemForm.output_description}
                    onChange={(e) => setProblemForm({ ...problemForm, output_description: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="prob_pub"
                  checked={problemForm.is_published}
                  onChange={(e) => setProblemForm({ ...problemForm, is_published: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="prob_pub" className="text-slate-300">
                  เผยแพร่โจทย์ (Published)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setProblemModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                >
                  บันทึกโจทย์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Test Case Modal */}
      {tcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel bg-[#0d121f] border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white">
              เพิ่ม Test Case สำหรับโจทย์ #{selectedProblemId}
            </h3>

            <form onSubmit={handleSaveTestCase} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-semibold">Input Data:</label>
                <textarea
                  rows={3}
                  value={tcForm.input_data}
                  onChange={(e) => setTcForm({ ...tcForm, input_data: e.target.value })}
                  placeholder="เช่น: 10 20"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-semibold">Expected Output:</label>
                <textarea
                  required
                  rows={3}
                  value={tcForm.expected_output}
                  onChange={(e) => setTcForm({ ...tcForm, expected_output: e.target.value })}
                  placeholder="เช่น: 30"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300"
                />
              </div>

              <div className="flex items-center space-x-4 pt-2 font-sans">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tcForm.is_hidden}
                    onChange={(e) => setTcForm({ ...tcForm, is_hidden: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-slate-300">ซ่อนไว้ (Hidden Test Case)</span>
                </label>

                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400">Points:</span>
                  <input
                    type="number"
                    value={tcForm.points}
                    onChange={(e) => setTcForm({ ...tcForm, points: parseInt(e.target.value) })}
                    className="w-16 p-1 rounded bg-slate-900 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800 font-sans">
                <button
                  type="button"
                  onClick={() => setTcModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                >
                  บันทึก Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Code Viewer Modal */}
      {codeViewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl p-6 rounded-2xl glass-panel bg-[#0d121f] border border-white/10 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-white">
                  โค้ด Submission #{codeViewerModal.id}
                </h3>
                <span className="text-xs text-slate-400">
                  User #{codeViewerModal.userId} • Status: {codeViewerModal.status}
                </span>
              </div>
              <button
                onClick={() => setCodeViewerModal(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ปิด ✕
              </button>
            </div>

            <pre className="flex-1 p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-emerald-300 overflow-y-auto whitespace-pre-wrap">
              {codeViewerModal.code}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
