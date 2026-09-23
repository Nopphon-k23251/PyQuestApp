import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  Folder,
  FolderOpen,
  FileCode,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  ExternalLink,
  Code2,
  ListOrdered,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { adminApi } from "../../services/api/adminApi";
import {
  Course,
  ProblemAdminItem,
  TestCase,
  Submission,
  Difficulty,
} from "../../types";
import { ConfirmModal, ConfirmModalType } from "../../components/feedback/ConfirmModal";
import { CustomSelect } from "../../components/common/CustomSelect";

export const AdminDashboardPage: React.FC = () => {
  // Navigation / Selection State
  const [activeView, setActiveView] = useState<"overview" | "course" | "problem" | "submissions">("overview");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [problems, setProblems] = useState<ProblemAdminItem[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [problemTab, setProblemTab] = useState<"specs" | "testcases">("specs");

  // Toast / Alert Notification
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: ConfirmModalType;
    loading?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Modal Forms
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
    sample_input: "",
    sample_output: "",
  });

  const [tcModalOpen, setTcModalOpen] = useState(false);
  const [editingTc, setEditingTc] = useState<TestCase | null>(null);
  const [tcForm, setTcForm] = useState({
    input_data: "",
    expected_output: "",
    is_hidden: false,
    points: 5,
  });

  const [codeViewerModal, setCodeViewerModal] = useState<Submission | null>(null);

  // Auto-hide toast after 4s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ type, message });
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, sRes] = await Promise.all([
        adminApi.listCourses(1, 100),
        adminApi.listProblems(),
        adminApi.inspectSubmissions(1, 50),
      ]);
      const loadedCourses = cRes?.items || [];
      const loadedProblems = Array.isArray(pRes) ? pRes : (pRes as any)?.items || [];
      setCourses(loadedCourses);
      setProblems(loadedProblems);
      setSubmissions(sRes?.items || []);

      // Keep course folders closed by default
      setExpandedCourses({});
    } catch (err: any) {
      console.error("Admin data load error:", err);
      showToast(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseExpand = (courseId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  // Selected entities
  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  const selectedProblem = useMemo(() => {
    return problems.find((p) => p.id === selectedProblemId) || null;
  }, [problems, selectedProblemId]);

  const selectCourse = (course: Course) => {
    setSelectedCourseId(course.id);
    setSelectedProblemId(null);
    setActiveView("course");
  };

  const selectProblem = async (problem: ProblemAdminItem) => {
    setSelectedProblemId(problem.id);
    setSelectedCourseId(problem.courseId);
    setActiveView("problem");
    setProblemTab("specs");
    try {
      const tcRes = await adminApi.getTestCases(problem.id);
      setTestCases(tcRes || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Tree Items based on search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter((c) => {
      const matchCourse = c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
      const matchProblems = problems.some(
        (p) => p.courseId === c.id && (p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
      );
      return matchCourse || matchProblems;
    });
  }, [courses, problems, searchQuery]);

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
        is_published: true,
      });
    }
    setCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await adminApi.updateCourse(editingCourse.id, courseForm);
        showToast("บันทึกการแก้ไขคอร์สเรียบร้อยแล้ว");
      } else {
        await adminApi.createCourse(courseForm);
        showToast("สร้างคอร์สใหม่เรียบร้อยแล้ว");
      }
      setCourseModalOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "ไม่สามารถบันทึกคอร์สได้", "error");
    }
  };

  const triggerDeleteCourse = (course: Course, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "ยืนยันการลบคอร์ส",
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบคอร์ส "${course.title}"? โจทย์ทั้งหมดในคอร์สนี้จะได้รับผลกระทบ`,
      confirmText: "ลบคอร์ส",
      type: "danger",
      onConfirm: async () => {
        try {
          await adminApi.deleteCourse(course.id);
          showToast(`ลบคอร์ส "${course.title}" เรียบร้อยแล้ว`);
          if (selectedCourseId === course.id) {
            setSelectedCourseId(null);
            setSelectedProblemId(null);
            setActiveView("overview");
          }
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadAllData();
        } catch (err: any) {
          showToast(err.message || "ไม่สามารถลบคอร์สได้", "error");
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleTogglePublishCourse = async (course: Course, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await adminApi.updateCourse(course.id, { is_published: !course.isPublished });
      showToast(`เปลี่ยนสถานะเป็น ${!course.isPublished ? "เผยแพร่แล้ว (Published)" : "ฉบับร่าง (Draft)"}`);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "ไม่สามารถเปลี่ยนสถานะได้", "error");
    }
  };

  // --- Problem handlers ---
  const handleOpenProblemModal = (problem?: ProblemAdminItem, defaultCourseId?: number) => {
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
        sample_input: "",
        sample_output: "",
      });
    } else {
      setEditingProblem(null);
      setProblemForm({
        course_id: defaultCourseId || selectedCourseId || courses[0]?.id || 1,
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
        is_published: true,
        sample_input: "",
        sample_output: "",
      });
    }
    setProblemModalOpen(true);
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { sample_input, sample_output, ...payload } = problemForm;
      if (editingProblem) {
        await adminApi.updateProblem(editingProblem.id, payload);
        showToast("บันทึกการแก้ไขโจทย์เรียบร้อยแล้ว");
      } else {
        const created = await adminApi.createProblem(payload);
        if (created?.id && (sample_input || sample_output)) {
          try {
            await adminApi.createTestCase(created.id, {
              input_data: sample_input || "",
              expected_output: sample_output || "",
              is_hidden: false,
              points: 5,
            });
          } catch (tcErr) {
            console.warn("Failed to auto-create sample testcase:", tcErr);
          }
        }
        showToast("สร้างโจทย์ใหม่เรียบร้อยแล้ว");
      }
      setProblemModalOpen(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "ไม่สามารถบันทึกโจทย์ได้", "error");
    }
  };

  const triggerDeleteProblem = (problem: ProblemAdminItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "ยืนยันการลบโจทย์",
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบโจทย์ "${problem.title}"? ชุด Test Cases และประวัติการส่งทั้งหมดของโจทย์นี้จะถูกลบออกด้วย`,
      confirmText: "ลบโจทย์",
      type: "danger",
      onConfirm: async () => {
        try {
          await adminApi.deleteProblem(problem.id);
          showToast(`ลบโจทย์ "${problem.title}" เรียบร้อยแล้ว`);
          if (selectedProblemId === problem.id) {
            setSelectedProblemId(null);
            setActiveView(selectedCourseId ? "course" : "overview");
          }
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          loadAllData();
        } catch (err: any) {
          showToast(err.message || "ไม่สามารถลบโจทย์ได้", "error");
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleTogglePublishProblem = async (problem: ProblemAdminItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await adminApi.updateProblem(problem.id, { is_published: !problem.isPublished });
      showToast(`เปลี่ยนสถานะโจทย์เป็น ${!problem.isPublished ? "เผยแพร่แล้ว (Published)" : "ฉบับร่าง (Draft)"}`);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "ไม่สามารถเปลี่ยนสถานะได้", "error");
    }
  };

  // --- Test Case handlers ---
  const handleToggleTcVisibility = async (tc: TestCase) => {
    try {
      const newHiddenState = !tc.isHidden;
      await adminApi.updateTestCase(tc.id, { is_hidden: newHiddenState });
      if (selectedProblemId) {
        const updated = await adminApi.getTestCases(selectedProblemId);
        setTestCases(updated);
      }
      showToast(newHiddenState ? "เปลี่ยนเป็น Test Case ลับ (Hidden)" : "เปลี่ยนเป็น Test Case ตัวอย่าง (Sample)");
    } catch (err: any) {
      showToast(err.message || "ไม่สามารถเปลี่ยนประเภท Test Case ได้", "error");
    }
  };

  const handleOpenAddTcModal = () => {
    setEditingTc(null);
    setTcForm({
      input_data: "",
      expected_output: "",
      is_hidden: false,
      points: 5,
    });
    setTcModalOpen(true);
  };

  const handleOpenEditTcModal = (tc: TestCase) => {
    setEditingTc(tc);
    setTcForm({
      input_data: tc.inputData || (tc as any).input_data || "",
      expected_output: tc.expectedOutput || (tc as any).expected_output || "",
      is_hidden: tc.isHidden ?? false,
      points: tc.points ?? 5,
    });
    setTcModalOpen(true);
  };

  const handleSaveTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProblemId) return;
    try {
      if (editingTc) {
        await adminApi.updateTestCase(editingTc.id, tcForm);
        showToast("บันทึกการแก้ไข Test Case เรียบร้อยแล้ว");
      } else {
        await adminApi.createTestCase(selectedProblemId, tcForm);
        showToast("เพิ่ม Test Case ใหม่เรียบร้อยแล้ว");
      }
      setTcModalOpen(false);
      setEditingTc(null);
      const updated = await adminApi.getTestCases(selectedProblemId);
      setTestCases(updated);
    } catch (err: any) {
      showToast(err.message || "ไม่สามารถบันทึก Test Case ได้", "error");
    }
  };

  const triggerDeleteTestCase = (tcId: number) => {
    setConfirmModal({
      isOpen: true,
      title: "ยืนยันการลบ Test Case",
      message: "คุณแน่ใจหรือไม่ว่าต้องการลบชุดทดสอบ (Test Case) นี้ออกจากระบบ?",
      confirmText: "ลบ Test Case",
      type: "danger",
      onConfirm: async () => {
        try {
          await adminApi.deleteTestCase(tcId);
          showToast("ลบ Test Case เรียบร้อยแล้ว");
          if (selectedProblemId) {
            const updated = await adminApi.getTestCases(selectedProblemId);
            setTestCases(updated);
          }
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          showToast(err.message || "ไม่สามารถลบ Test Case ได้", "error");
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const getDifficultyBadge = (diff: Difficulty) => {
    switch (diff) {
      case "EASY":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">EASY</span>;
      case "MEDIUM":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">MED</span>;
      case "HARD":
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">HARD</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen bg-[#07090e] overflow-hidden">
      {/* Toast Alert Banner */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-top duration-200 ${
            toast.type === "error"
              ? "bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-950/50"
              : toast.type === "info"
              ? "bg-indigo-950/90 text-indigo-200 border-indigo-500/30 shadow-indigo-950/50"
              : "bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-950/50"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top IDE Toolbar */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/[0.08] bg-[#090d18] flex-shrink-0">
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-rose-400 font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Admin Studio</span>
          </div>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">
            {activeView === "problem" && selectedProblem
              ? `${selectedCourse?.title || "Course"} > ${selectedProblem.title}`
              : activeView === "course" && selectedCourse
              ? selectedCourse.title
              : activeView === "submissions"
              ? "Live Submissions Log"
              : "Overview"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenCourseModal()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้างคอร์ส</span>
          </button>

          <button
            onClick={() => handleOpenProblemModal(undefined, selectedCourseId || undefined)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้างโจทย์</span>
          </button>

          <button
            onClick={loadAllData}
            title="รีเฟรชข้อมูล"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: File Explorer (Left) & Inspector/Editor (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT COLUMN: FILE EXPLORER TREE VIEW */}
        {/* ========================================================= */}
        <div className="w-72 lg:w-80 flex-shrink-0 flex flex-col border-r border-white/[0.08] bg-[#080c16] overflow-hidden">
          {/* Explorer Title & Search */}
          <div className="p-3 border-b border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>EXPLORER</span>
              </span>

              <button
                onClick={() => setActiveView("overview")}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  activeView === "overview"
                    ? "bg-indigo-500/20 text-indigo-300 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Overview
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหาคอร์สหรือโจทย์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tree View Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 select-none">
            {/* Tree Section 1: Courses & Problems */}
            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>COURSES & PROBLEMS</span>
              <span>{courses.length}</span>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                {searchQuery ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีคอร์สในระบบ"}
              </div>
            ) : (
              filteredCourses.map((course) => {
                const isExpanded = searchQuery.trim() ? true : (expandedCourses[course.id] ?? false);
                const isCourseSelected = activeView === "course" && selectedCourseId === course.id;
                const courseProblems = problems.filter((p) => p.courseId === course.id);

                return (
                  <div key={course.id} className="space-y-0.5">
                    {/* Course Folder Row */}
                    <div
                      onClick={() => selectCourse(course)}
                      className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-colors ${
                        isCourseSelected
                          ? "bg-indigo-600/20 text-white font-semibold border border-indigo-500/30"
                          : "text-slate-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 min-w-0 pr-16">
                        {/* Expand / Collapse Chevron */}
                        <button
                          type="button"
                          onClick={(e) => toggleCourseExpand(course.id, e)}
                          className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Folder Icon */}
                        {isExpanded ? (
                          <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        ) : (
                          <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        )}

                        <span className="truncate">{course.title}</span>
                      </div>

                      {/* Right metadata (always fixed in place, never shifts) */}
                      <span className="text-[10px] text-slate-500 flex-shrink-0 pr-0.5">
                        ({courseProblems.length})
                      </span>

                      {/* Absolute Hover Action Overlay (zero layout shift underneath) */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center space-x-0.5 bg-[#0b101e]/95 border border-white/10 rounded-md px-1 py-0.5 shadow-lg pointer-events-none group-hover:pointer-events-auto">
                        <button
                          type="button"
                          title="สร้างโจทย์ในคอร์สนี้"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProblemModal(undefined, course.id);
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          title="แก้ไขคอร์ส"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCourseModal(course);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          title="ลบคอร์ส"
                          onClick={(e) => triggerDeleteCourse(course, e)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Problem Files (Nested under Course) */}
                    {isExpanded && (
                      <div className="pl-6 space-y-0.5 border-l border-white/5 ml-3">
                        {courseProblems.length === 0 ? (
                          <div className="px-3 py-1 text-[11px] text-slate-500 italic">
                            (ยังไม่มีโจทย์ในคอร์สนี้)
                          </div>
                        ) : (
                          courseProblems.map((prob) => {
                            const isProblemSelected =
                              activeView === "problem" && selectedProblemId === prob.id;

                            return (
                              <div
                                key={prob.id}
                                onClick={() => selectProblem(prob)}
                                className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                                  isProblemSelected
                                    ? "bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                                }`}
                              >
                                <div className="flex items-center space-x-2 min-w-0 pr-14">
                                  <FileCode
                                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                                      isProblemSelected ? "text-emerald-400" : "text-slate-500"
                                    }`}
                                  />
                                  <span className="truncate">{prob.title}.py</span>
                                </div>

                                {/* Always visible difficulty badge (never moves) */}
                                <div className="flex items-center flex-shrink-0">
                                  {getDifficultyBadge(prob.difficulty)}
                                </div>

                                {/* Absolute Hover Action Overlay (zero layout shift underneath) */}
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center space-x-0.5 bg-[#0b101e]/95 border border-white/10 rounded-md px-1 py-0.5 shadow-lg pointer-events-none group-hover:pointer-events-auto">
                                  <button
                                    type="button"
                                    title={prob.isPublished ? "ซ่อนเป็นดราฟต์" : "เผยแพร่โจทย์"}
                                    onClick={(e) => handleTogglePublishProblem(prob, e)}
                                    className="p-1 text-slate-400 hover:text-indigo-400 rounded transition-colors"
                                  >
                                    {prob.isPublished ? (
                                      <Eye className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <EyeOff className="w-3 h-3 text-slate-500" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    title="ลบโจทย์"
                                    onClick={(e) => triggerDeleteProblem(prob, e)}
                                    className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Tree Section 2: Submissions & Logs */}
            <div className="pt-4 px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>MONITORING</span>
            </div>

            <div
              onClick={() => setActiveView("submissions")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs font-medium transition-all ${
                activeView === "submissions"
                  ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center space-x-2">
                <ListOrdered className="w-4 h-4 text-sky-400" />
                <span>ประวัติการส่ง (Submissions)</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {submissions.length}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: INSPECTOR & DETAIL WORKSPACE */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col bg-[#07090e] overflow-y-auto">
          {/* VIEW A: PROBLEM INSPECTOR */}
          {activeView === "problem" && selectedProblem ? (
            <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
              {/* Problem Inspector Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-mono">#{selectedProblem.id}</span>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {selectedProblem.title}
                    </h2>
                    {getDifficultyBadge(selectedProblem.difficulty)}
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      +{selectedProblem.points} คะแนน
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-2">
                    <span>คอร์ส: <span className="text-indigo-300 font-medium">{selectedCourse?.title}</span></span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">slug: {selectedProblem.slug}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    to={`/problems/${selectedProblem.id}`}
                    target="_blank"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                  >
                    <span>ลองทำโจทย์</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleOpenProblemModal(selectedProblem)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>แก้ไข</span>
                  </button>

                  <button
                    onClick={() => triggerDeleteProblem(selectedProblem)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="ลบโจทย์"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Problem Tabs */}
              <div className="flex items-center space-x-1 border-b border-white/[0.08]">
                <button
                  onClick={() => setProblemTab("specs")}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    problemTab === "specs"
                      ? "border-indigo-500 text-white bg-slate-900/60"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>รายละเอียดโจทย์ (Specs)</span>
                </button>

                <button
                  onClick={() => setProblemTab("testcases")}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    problemTab === "testcases"
                      ? "border-emerald-500 text-white bg-slate-900/60"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>Test Cases ({testCases.length})</span>
                </button>
              </div>

              {/* Tab 1: Specs */}
              {problemTab === "specs" && (
                <div className="space-y-6">
                  {/* Meta Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                      <div className="text-[11px] text-slate-500">คะแนน (Points)</div>
                      <div className="text-base font-bold text-amber-300">{selectedProblem.points} pts</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                      <div className="text-[11px] text-slate-500">เวลาจำกัด (Time Limit)</div>
                      <div className="text-base font-bold text-slate-200">{selectedProblem.timeLimitMs} ms</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                      <div className="text-[11px] text-slate-500">หน่วยความจำ (Memory)</div>
                      <div className="text-base font-bold text-slate-200">{selectedProblem.memoryLimitMb} MB</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
                      <div className="text-[11px] text-slate-500">สถานะ (Status)</div>
                      <div className="text-base font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                        {selectedProblem.isPublished ? (
                          <span className="text-emerald-400 text-xs flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> Published
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                            <EyeOff className="w-3.5 h-3.5" /> Draft
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">คำอธิบายโจทย์ (Description)</h4>
                    <div className="p-4 rounded-xl bg-[#090d18] border border-white/5 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedProblem.description}
                    </div>
                  </div>

                  {/* Input / Output Specs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">ข้อมูลนำเข้า (Input Description)</h4>
                      <div className="p-3.5 rounded-xl bg-[#090d18] border border-white/5 text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
                        {selectedProblem.inputDescription || "(ไม่มีระบุ)"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">ข้อมูลส่งออก (Output Description)</h4>
                      <div className="p-3.5 rounded-xl bg-[#090d18] border border-white/5 text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
                        {selectedProblem.outputDescription || "(ไม่มีระบุ)"}
                      </div>
                    </div>
                  </div>

                  {/* Constraints */}
                  {selectedProblem.constraintsText && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">เงื่อนไขและข้อจำกัด (Constraints)</h4>
                      <div className="p-3 rounded-xl bg-[#090d18] border border-white/5 font-mono text-xs text-amber-300">
                        {selectedProblem.constraintsText}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Test Cases Manager */}
              {problemTab === "testcases" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">ชุดทดสอบของโจทย์ (Test Cases)</h3>
                      <p className="text-xs text-slate-400">
                        ชุดทดสอบตัวอย่าง (Sample) จะแสดงให้ผู้เรียนเห็นในหน้าโจทย์ ส่วนชุดทดสอบลับ (Hidden) จะใช้ตรวจจริง
                      </p>
                    </div>

                    <button
                      onClick={handleOpenAddTcModal}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่ม Test Case</span>
                    </button>
                  </div>

                  {testCases.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 space-y-3">
                      <div className="p-3 rounded-xl bg-slate-900 w-fit mx-auto text-slate-500">
                        <Code2 className="w-6 h-6" />
                      </div>
                      <div className="text-sm text-slate-400 font-medium">ยังไม่มี Test Case สำหรับโจทย์นี้</div>
                      <button
                        onClick={handleOpenAddTcModal}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                      >
                        เพิ่ม Test Case แรก
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/5 overflow-hidden bg-[#090d18]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">ประเภท (Visibility)</th>
                            <th className="py-3 px-4">Input (stdin)</th>
                            <th className="py-3 px-4">Expected Output</th>
                            <th className="py-3 px-4">คะแนน</th>
                            <th className="py-3 px-4 text-right">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                          {testCases.map((tc, index) => (
                            <tr key={tc.id} className="hover:bg-white/[0.02]">
                              <td className="py-3 px-4 text-slate-500 font-bold">{index + 1}</td>
                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTcVisibility(tc)}
                                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-bold transition-all cursor-pointer ${
                                    tc.isHidden
                                      ? "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                                      : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30"
                                  }`}
                                  title="คลิกเพื่อสลับระหว่างตัวอย่าง (Sample) และลับ (Hidden)"
                                >
                                  {tc.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  <span>{tc.isHidden ? "ลับ (Hidden)" : "ตัวอย่าง (Sample)"}</span>
                                </button>
                              </td>
                              <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                                {tc.inputData || (tc as any).input_data || <span className="text-slate-600">(empty)</span>}
                              </td>
                              <td className="py-3 px-4 max-w-xs truncate text-emerald-300">
                                {tc.expectedOutput || (tc as any).expected_output}
                              </td>
                              <td className="py-3 px-4 text-amber-300 font-bold">{tc.points} pts</td>
                              <td className="py-3 px-4 text-right space-x-1 font-sans">
                                <button
                                  onClick={() => handleOpenEditTcModal(tc)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-white/5 rounded-lg transition-colors"
                                  title="แก้ไข Test Case"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => triggerDeleteTestCase(tc.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="ลบ Test Case"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeView === "course" && selectedCourse ? (
            /* VIEW B: COURSE INSPECTOR */
            <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-mono">#{selectedCourse.id}</span>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{selectedCourse.title}</h2>
                    {getDifficultyBadge(selectedCourse.difficulty)}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">slug: {selectedCourse.slug}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTogglePublishCourse(selectedCourse)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                  >
                    {selectedCourse.isPublished ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>เผยแพร่อยู่</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span>ฉบับร่าง (Draft)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenCourseModal(selectedCourse)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>แก้ไขคอร์ส</span>
                  </button>

                  <button
                    onClick={() => triggerDeleteCourse(selectedCourse)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="ลบคอร์ส"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Course Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">คำอธิบายคอร์ส (Description)</h4>
                <div className="p-4 rounded-xl bg-[#090d18] border border-white/5 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedCourse.description}
                </div>
              </div>

              {/* Problems in this course */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    โจทย์ในคอร์สนี้ ({problems.filter((p) => p.courseId === selectedCourse.id).length})
                  </h4>

                  <button
                    onClick={() => handleOpenProblemModal(undefined, selectedCourse.id)}
                    className="flex items-center space-x-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มโจทย์ในคอร์สนี้</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {problems.filter((p) => p.courseId === selectedCourse.id).map((prob) => (
                    <div
                      key={prob.id}
                      onClick={() => selectProblem(prob)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#090d18] hover:bg-white/[0.04] border border-white/5 cursor-pointer transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <FileCode className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white">{prob.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{prob.slug}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getDifficultyBadge(prob.difficulty)}
                        <span className="text-xs font-bold text-amber-300">+{prob.points} pts</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeView === "submissions" ? (
            /* VIEW C: LIVE SUBMISSIONS AUDIT */
            <div className="p-6 space-y-4 max-w-5xl mx-auto w-full">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">ประวัติการส่งโค้ดทั้งหมด (Submissions)</h2>
                <p className="text-xs text-slate-400">ตรวจสอบสถานะการส่งโค้ด ผลการตรวจ และเปิดดูซอร์สโค้ดของผู้เรียน</p>
              </div>

              <div className="rounded-2xl border border-white/5 overflow-hidden bg-[#090d18]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4"># ID</th>
                      <th className="py-3 px-4">ผู้ส่ง (User)</th>
                      <th className="py-3 px-4">โจทย์ (Problem)</th>
                      <th className="py-3 px-4">สถานะ (Verdict)</th>
                      <th className="py-3 px-4">เวลาตรวจ</th>
                      <th className="py-3 px-4">ส่งเมื่อ</th>
                      <th className="py-3 px-4 text-right">โค้ด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                          ยังไม่มีประวัติการส่งโค้ด
                        </td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 text-slate-500">{sub.id}</td>
                          <td className="py-3 px-4 font-sans font-medium text-white">{sub.userId}</td>
                          <td className="py-3 px-4 font-sans text-indigo-300">Problem #{sub.problemId}</td>
                          <td className="py-3 px-4 font-sans">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sub.status === "ACCEPTED"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {sub.status}
                              </span>
                              {(sub.totalTestCases || sub.total_test_cases) ? (
                                <span className="text-[10px] font-mono text-slate-400">
                                  ({sub.passedTestCases ?? sub.passed_test_cases ?? 0}/{sub.totalTestCases ?? sub.total_test_cases})
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400">{sub.executionTimeMs ?? 0} ms</td>
                          <td className="py-3 px-4 font-sans text-[11px] text-slate-500">
                            {new Date(sub.createdAt).toLocaleDateString("th-TH")}
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <button
                              onClick={() => setCodeViewerModal(sub)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                            >
                              ดูโค้ด
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VIEW D: OVERVIEW DASHBOARD */
            <div className="p-8 space-y-8 max-w-4xl mx-auto w-full my-auto">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">PyQuest Admin Studio</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  เลือกคอร์สหรือไฟล์โจทย์จากแถบ File Explorer ทางซ้ายมือ เพื่อจัดการเนื้อหา ข้อมูลทดสอบ และตรวจสอบผล
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>คอร์สทั้งหมด</span>
                    <Folder className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{courses.length}</div>
                </div>

                <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>โจทย์ทั้งหมด</span>
                    <FileCode className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{problems.length}</div>
                </div>

                <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>การส่งคำตอบทั้งหมด</span>
                    <ListOrdered className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{submissions.length}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleOpenCourseModal()}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างคอร์สใหม่</span>
                </button>

                <button
                  onClick={() => handleOpenProblemModal()}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างโจทย์ใหม่</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* CUSTOM CONFIRM MODAL */}
      {/* ========================================================= */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* ========================================================= */}
      {/* MODAL 1: COURSE CREATE / EDIT */}
      {/* ========================================================= */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCourseModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0c101c] border border-white/10 p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">
                {editingCourse ? "แก้ไขคอร์สเรียน" : "สร้างคอร์สเรียนใหม่"}
              </h3>
              <button onClick={() => setCourseModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">ชื่อคอร์ส (Title)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Python Fundamentals"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Slug (URL friendly)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น python-fundamentals"
                  value={courseForm.slug}
                  onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">ระดับความยาก (Difficulty)</label>
                <CustomSelect
                  value={courseForm.difficulty}
                  onChange={(val) => setCourseForm({ ...courseForm, difficulty: val as Difficulty })}
                  options={[
                    {
                      value: "EASY",
                      label: "EASY (ง่าย)",
                      badge: <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ง่าย</span>,
                    },
                    {
                      value: "MEDIUM",
                      label: "MEDIUM (ปานกลาง)",
                      badge: <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">ปานกลาง</span>,
                    },
                    {
                      value: "HARD",
                      label: "HARD (ยาก)",
                      badge: <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">ยาก</span>,
                    },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">คำอธิบายคอร์ส</label>
                <textarea
                  rows={3}
                  required
                  placeholder="รายละเอียดเนื้อหาในคอร์ส..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={courseForm.is_published}
                  onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300">เผยแพร่คอร์สทันที (Published)</span>
              </label>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20 transition-all"
                >
                  {editingCourse ? "บันทึกการแก้ไข" : "สร้างคอร์ส"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: PROBLEM CREATE / EDIT */}
      {/* ========================================================= */}
      {problemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setProblemModalOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0c101c] border border-white/10 p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">
                {editingProblem ? "แก้ไขโจทย์เขียนโปรแกรม" : "สร้างโจทย์ใหม่"}
              </h3>
              <button onClick={() => setProblemModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">สังกัดคอร์ส</label>
                  <CustomSelect
                    value={problemForm.course_id}
                    onChange={(val) => setProblemForm({ ...problemForm, course_id: Number(val) })}
                    placeholder="เลือกคอร์ส..."
                    options={courses.map((c) => ({
                      value: c.id,
                      label: c.title,
                      description: `slug: ${c.slug}`,
                      badge: getDifficultyBadge(c.difficulty),
                    }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">ระดับความยาก</label>
                  <CustomSelect
                    value={problemForm.difficulty}
                    onChange={(val) => setProblemForm({ ...problemForm, difficulty: val as Difficulty })}
                    options={[
                      {
                        value: "EASY",
                        label: "EASY (ง่าย)",
                        badge: <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ง่าย</span>,
                      },
                      {
                        value: "MEDIUM",
                        label: "MEDIUM (ปานกลาง)",
                        badge: <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">ปานกลาง</span>,
                      },
                      {
                        value: "HARD",
                        label: "HARD (ยาก)",
                        badge: <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">ยาก</span>,
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">ชื่อโจทย์ (Title)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ตรวจสอบเลขคู่หรือคี่"
                    value={problemForm.title}
                    onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Slug (URL friendly)</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น even-or-odd"
                    value={problemForm.slug}
                    onChange={(e) => setProblemForm({ ...problemForm, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">คะแนน (Points)</label>
                  <input
                    type="number"
                    min={1}
                    value={problemForm.points}
                    onChange={(e) => setProblemForm({ ...problemForm, points: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Time Limit (ms)</label>
                  <input
                    type="number"
                    min={100}
                    value={problemForm.time_limit_ms}
                    onChange={(e) => setProblemForm({ ...problemForm, time_limit_ms: parseInt(e.target.value) || 1000 })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Memory (MB)</label>
                  <input
                    type="number"
                    min={16}
                    value={problemForm.memory_limit_mb}
                    onChange={(e) => setProblemForm({ ...problemForm, memory_limit_mb: parseInt(e.target.value) || 128 })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">รายละเอียดโจทย์ (Description)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="เขียนอธิบายโจทย์และสิ่งที่ต้องการให้โปรแกรมทำ..."
                  value={problemForm.description}
                  onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">คำอธิบาย Input</label>
                  <textarea
                    rows={2}
                    placeholder="เช่น จำนวนเต็ม N หนึ่งตัว..."
                    value={problemForm.input_description}
                    onChange={(e) => setProblemForm({ ...problemForm, input_description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">คำอธิบาย Output</label>
                  <textarea
                    rows={2}
                    placeholder="เช่น พิมพ์คำว่า Even หรือ Odd..."
                    value={problemForm.output_description}
                    onChange={(e) => setProblemForm({ ...problemForm, output_description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">เงื่อนไข / ขอบเขตข้อมูล (Constraints)</label>
                <input
                  type="text"
                  placeholder="เช่น 1 <= N <= 100,000"
                  value={problemForm.constraints_text}
                  onChange={(e) => setProblemForm({ ...problemForm, constraints_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Sample Testcase on Create */}
              {!editingProblem && (
                <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2.5">
                  <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ข้อมูลทดสอบตัวอย่างเริ่มต้น (Sample Testcase)</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <textarea
                      rows={2}
                      placeholder="Input ตัวอย่าง เช่น 4"
                      value={problemForm.sample_input}
                      onChange={(e) => setProblemForm({ ...problemForm, sample_input: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                      rows={2}
                      placeholder="Expected Output เช่น Even"
                      value={problemForm.sample_output}
                      onChange={(e) => setProblemForm({ ...problemForm, sample_output: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={problemForm.is_published}
                  onChange={(e) => setProblemForm({ ...problemForm, is_published: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300">เผยแพร่โจทย์ทันที (Published)</span>
              </label>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setProblemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20 transition-all"
                >
                  {editingProblem ? "บันทึกการแก้ไข" : "สร้างโจทย์"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: TEST CASE CREATE / EDIT */}
      {/* ========================================================= */}
      {tcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setTcModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0c101c] border border-white/10 p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">
                {editingTc ? "แก้ไข Test Case" : "เพิ่ม Test Case ใหม่"}
              </h3>
              <button onClick={() => setTcModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTestCase} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Input Data (Standard Input)</label>
                <textarea
                  rows={3}
                  placeholder="ข้อมูลนำเข้าที่ส่งผ่าน stdin..."
                  value={tcForm.input_data}
                  onChange={(e) => setTcForm({ ...tcForm, input_data: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Expected Output (ผลลัพธ์ที่ถูกต้อง)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="ผลลัพธ์ที่คาดหวัง..."
                  value={tcForm.expected_output}
                  onChange={(e) => setTcForm({ ...tcForm, expected_output: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">คะแนนของเคสนี้</label>
                  <input
                    type="number"
                    min={1}
                    value={tcForm.points}
                    onChange={(e) => setTcForm({ ...tcForm, points: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">ประเภทการแสดงผล</label>
                  <CustomSelect
                    value={tcForm.is_hidden ? "true" : "false"}
                    onChange={(val) => setTcForm({ ...tcForm, is_hidden: val === "true" })}
                    options={[
                      {
                        value: "false",
                        label: "ตัวอย่าง (Sample - แสดงให้เห็น)",
                        description: "แสดงให้นักเรียนเห็นเป็นตัวอย่างในหน้าโจทย์",
                        badge: <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sample</span>,
                      },
                      {
                        value: "true",
                        label: "ลับ (Hidden - ใช้ตรวจจริง)",
                        description: "ซ่อนไม่ให้นักเรียนเห็น ใช้สำหรับการส่งตรวจจริง",
                        badge: <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">Hidden</span>,
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setTcModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20 transition-all"
                >
                  {editingTc ? "บันทึก Test Case" : "เพิ่ม Test Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: SUBMISSION CODE INSPECTOR */}
      {/* ========================================================= */}
      {codeViewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCodeViewerModal(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0c101c] border border-white/10 p-6 shadow-2xl z-10 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">Submission #{codeViewerModal.id} Source Code</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                  <span>สถานะ: {codeViewerModal.status}</span>
                  {(codeViewerModal.totalTestCases || codeViewerModal.total_test_cases) ? (
                    <span className="font-mono text-indigo-300">
                      (ผ่าน {codeViewerModal.passedTestCases ?? codeViewerModal.passed_test_cases ?? 0}/{codeViewerModal.totalTestCases ?? codeViewerModal.total_test_cases} Test Cases)
                    </span>
                  ) : null}
                </div>
              </div>
              <button onClick={() => setCodeViewerModal(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#060810] border border-white/5 text-slate-200 font-mono text-xs overflow-x-auto max-h-[60vh] leading-relaxed">
              {codeViewerModal.code}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setCodeViewerModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
