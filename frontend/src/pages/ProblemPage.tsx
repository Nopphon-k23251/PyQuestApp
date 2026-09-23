import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Play,
  Send,
  Upload,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileCode,
  Copy,
  Check,
  Sparkles,
  Terminal,
  ShieldAlert,
} from "lucide-react";
import { problemApi, CodeRunResult, SubmitResult } from "../services/api/problemApi";
import { submissionApi } from "../services/api/submissionApi";
import { useAuth } from "../features/auth/AuthContext";
import { Problem, Submission, SubmissionStatus } from "../types";
import { LocalExecutionConsentModal } from "../components/feedback/LocalExecutionConsentModal";
import { CodeEditor } from "../components/editor/CodeEditor";

const DEFAULT_PYTHON_TEMPLATE = `# Write your Python solution below
import sys

def main():
    # Read input from standard input
    # Example: a, b = map(int, input().split())
    pass

if __name__ == '__main__':
    main()
`;

export const ProblemPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const { user } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(DEFAULT_PYTHON_TEMPLATE);
  const [activeLeftTab, setActiveLeftTab] = useState<"desc" | "samples" | "history">("desc");
  const [activeBottomTab, setActiveBottomTab] = useState<"run" | "verdict">("run");

  // Execution states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null);
  const [submissionVerdict, setSubmissionVerdict] = useState<Submission | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Local execution consent
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"run" | "submit" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (problemId) {
      loadProblem(parseInt(problemId));
    }
  }, [problemId]);

  const loadProblem = async (id: number) => {
    setLoading(true);
    try {
      const data = await problemApi.getProblem(id);
      setProblem(data);
      const samples = data?.sampleTestCases || (data as any)?.sample_test_cases || [];
      if (samples.length > 0) {
        setCustomInput(samples[0].inputData || (samples[0] as any).input_data || "");
      }
      loadHistory(id);
    } catch (err) {
      console.error("Failed to load problem:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (id: number) => {
    if (!user) return;
    try {
      const res = await submissionApi.getMySubmissions(id, undefined, 1, 20);
      setHistory(res.items);
    } catch {
      // Ignore
    }
  };

  // First-time consent check
  const checkConsent = (action: "run" | "submit"): boolean => {
    const hasConsented = localStorage.getItem("pyquest_local_exec_consent") === "true";
    if (!hasConsented) {
      setPendingAction(action);
      setShowConsentModal(true);
      return false;
    }
    return true;
  };

  const handleConsentApproved = () => {
    localStorage.setItem("pyquest_local_exec_consent", "true");
    setShowConsentModal(false);
    if (pendingAction === "run") {
      executeRun();
    } else if (pendingAction === "submit") {
      executeSubmit();
    }
    setPendingAction(null);
  };

  // Interactive Run
  const handleRun = () => {
    if (!checkConsent("run")) return;
    executeRun();
  };

  const executeRun = async () => {
    if (!problem) return;
    setRunning(true);
    setActiveBottomTab("run");
    try {
      const res = await problemApi.runCode(problem.id, code, customInput);
      setRunResult(res);
    } catch (err: any) {
      setRunResult({
        status: "RUNTIME_ERROR",
        stdout: "",
        stderr: err.message || "Failed to execute code",
        execution_time_ms: 0,
      });
    } finally {
      setRunning(false);
    }
  };

  // Submit Solution
  const handleSubmit = () => {
    if (!checkConsent("submit")) return;
    executeSubmit();
  };

  const executeSubmit = async () => {
    if (!problem) return;
    setSubmitting(true);
    setActiveBottomTab("verdict");
    setSubmissionVerdict(null);

    try {
      const res: SubmitResult = await problemApi.submitCode(problem.id, code);
      // Fetch complete judged submission
      const judged = await submissionApi.getSubmission(res.submission_id);
      setSubmissionVerdict(judged);

      // If accepted, update local problem solved state
      if (judged.status === "ACCEPTED") {
        setProblem((prev) => (prev ? { ...prev, isSolved: true } : null));
      }
      loadHistory(problem.id);
    } catch (err: any) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // File Upload (.py)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".py")) {
      alert("กรุณาเลือกไฟล์ที่มีนามสกุล .py เท่านั้น");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCode(content);
      }
    };
    reader.readAsText(file);
  };

  // Tab key indents with 4 spaces inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handleSubmit();
      } else {
        handleRun();
      }
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);

      // Restore cursor position
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleToggleStar = async () => {
    if (!user || !problem) return;
    try {
      if (problem.isStarred) {
        await problemApi.unstarProblem(problem.id);
        setProblem({ ...problem, isStarred: false });
      } else {
        await problemApi.starProblem(problem.id);
        setProblem({ ...problem, isStarred: true });
      }
    } catch (err) {
      console.error("Failed to toggle star:", err);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-6 w-32 bg-slate-800 rounded" />
        <div className="h-96 glass-panel rounded-2xl" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-white">ไม่พบโจทย์</h2>
        <Link to="/courses" className="text-indigo-400 hover:underline mt-2 inline-block">
          กลับหน้ารวมคอร์ส
        </Link>
      </div>
    );
  }

  const lineCount = code.split("\n").length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-4 space-y-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <Link
            to={`/courses/${problem.courseId}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg font-bold text-white tracking-tight">
              {problem.title}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {problem.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              +{problem.points} คะแนน
            </span>
            {problem.isSolved && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                ผ่านแล้ว
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleStar}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              problem.isStarred
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${problem.isStarred ? "fill-amber-400" : ""}`} />
            <span>{problem.isStarred ? "ติดดาวแล้ว" : "ติดดาว"}</span>
          </button>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[calc(100vh-8.5rem)] lg:min-h-[620px]">
        {/* LEFT PANE: Problem Description & Samples */}
        <div className="lg:col-span-5 h-[480px] lg:h-full flex flex-col rounded-2xl glass-panel border border-white/5 overflow-hidden">
          {/* Left Tabs */}
          <div className="flex items-center border-b border-white/5 bg-slate-900/60 px-2 pt-2 space-x-1">
            <button
              onClick={() => setActiveLeftTab("desc")}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeLeftTab === "desc"
                  ? "border-indigo-500 text-white bg-slate-800/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              คำอธิบายโจทย์ (Description)
            </button>
            <button
              onClick={() => setActiveLeftTab("samples")}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeLeftTab === "samples"
                  ? "border-indigo-500 text-white bg-slate-800/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              ชุดข้อมูลตัวอย่าง (Samples)
            </button>
            <button
              onClick={() => setActiveLeftTab("history")}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeLeftTab === "history"
                  ? "border-indigo-500 text-white bg-slate-800/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              ประวัติการส่ง ({history.length})
            </button>
          </div>

          {/* Left Content Scrollable */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
            {activeLeftTab === "desc" && (
              <>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    รายละเอียด (Problem Description)
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {problem.description}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    ข้อมูลนำเข้า (Input Description)
                  </h3>
                  <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {problem.inputDescription}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    ข้อมูลส่งออก (Output Description)
                  </h3>
                  <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {problem.outputDescription}
                  </div>
                </div>

                {problem.constraintsText && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      เงื่อนไขและข้อจำกัด (Constraints)
                    </h3>
                    <div className="p-3 rounded-xl bg-slate-900/50 border border-white/5 font-mono text-xs text-amber-300/90">
                      {problem.constraintsText}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-white/5">
                  <span>⏱️ จำกัดเวลา: {problem.timeLimitMs} ms</span>
                  <span>💾 หน่วยความจำ: {problem.memoryLimitMb} MB</span>
                </div>
              </>
            )}

            {activeLeftTab === "samples" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  ตัวอย่างการทำงาน (Sample Test Cases)
                </h3>
                {((problem.sampleTestCases || (problem as any).sample_test_cases || []) as any[]).length === 0 ? (
                  <p className="text-slate-500 text-xs">ไม่มีตัวอย่างเพิ่มเติม</p>
                ) : (
                  ((problem.sampleTestCases || (problem as any).sample_test_cases || []) as any[]).map((tc, idx) => (
                    <div
                      key={tc.id || idx}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-white">ตัวอย่างที่ #{idx + 1}</span>
                        <button
                          onClick={() => copyToClipboard(tc.inputData || tc.input_data || "", idx)}
                          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>คัดลอก Input</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 font-medium block">
                          Input:
                        </span>
                        <pre className="p-2.5 rounded-lg bg-black/50 border border-white/5 font-mono text-xs text-emerald-300 overflow-x-auto">
                          {tc.inputData || tc.input_data || "(ไม่มี input)"}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 font-medium block">
                          Expected Output:
                        </span>
                        <pre className="p-2.5 rounded-lg bg-black/50 border border-white/5 font-mono text-xs text-indigo-300 overflow-x-auto">
                          {tc.expectedOutput || tc.expected_output || ""}
                        </pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeLeftTab === "history" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  ประวัติการส่งโจทย์ข้อนี้ของคุณ
                </h3>
                {history.length === 0 ? (
                  <p className="text-slate-500 text-xs">คุณยังไม่เคยส่งโจทย์ข้อนี้</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5">
                          {sub.status === "ACCEPTED" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <div>
                            <span
                              className={`text-xs font-bold ${
                                sub.status === "ACCEPTED"
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {sub.status}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {new Date(sub.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <span className="font-semibold text-white">
                            {sub.score} pts
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {sub.executionTimeMs ?? 0} ms
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Code Editor & Console */}
        <div className="lg:col-span-7 h-[650px] lg:h-full flex flex-col rounded-2xl glass-panel border border-white/5 overflow-hidden">
          {/* Editor Header Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-slate-900/70">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">
                solution.py
              </span>
              <span className="text-[11px] text-slate-500">
                (Python 3.12 / 3.14)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                accept=".py"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="อัปโหลดไฟล์ .py จากเครื่อง"
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors border border-white/5"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>อัปโหลด .py</span>
              </button>

              <button
                type="button"
                onClick={() => setCode(DEFAULT_PYTHON_TEMPLATE)}
                title="รีเซ็ตโค้ดเป็นค่าเริ่มต้น"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Monaco Code Editor with Python Syntax Highlighting & Autocomplete */}
          <div className="flex-1 min-h-[320px] relative overflow-hidden p-2 bg-[#060810]">
            <CodeEditor
              value={code}
              onChange={setCode}
              language="python"
              onRun={handleRun}
            />
          </div>

          {/* Bottom Console / Output Tabs */}
          <div className="border-t border-white/5 bg-[#090d18] flex flex-col h-56">
            {/* Console Toolbar */}
            <div className="flex items-center justify-between px-3 pt-2 border-b border-white/5">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setActiveBottomTab("run")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                    activeBottomTab === "run"
                      ? "border-indigo-500 text-white bg-slate-800/60"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ผลการรัน (Run Output)
                </button>
                <button
                  onClick={() => setActiveBottomTab("verdict")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                    activeBottomTab === "verdict"
                      ? "border-indigo-500 text-white bg-slate-800/60"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ผลการส่งตรวจ (Submission Verdict)
                </button>
              </div>

              {/* Action Buttons: Run & Submit */}
              <div className="flex items-center space-x-2 pb-1.5">
                <button
                  onClick={handleRun}
                  disabled={running || submitting}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-white/5 active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                  <span>{running ? "กำลังรัน..." : "รันโค้ด (Ctrl+Enter)"}</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={running || submitting}
                  className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "กำลังส่งตรวจ..." : "ส่งตรวจ (Submit)"}</span>
                </button>
              </div>
            </div>

            {/* Console Output Area */}
            <div className="flex-1 p-3 overflow-y-auto text-xs font-mono">
              {activeBottomTab === "run" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Status:{" "}
                      <strong className={runResult?.status === "ACCEPTED" ? "text-emerald-400" : "text-amber-400"}>
                        {runResult?.status ?? "พร้อมรัน"}
                      </strong>
                    </span>
                    {runResult?.execution_time_ms !== undefined && (
                      <span>⏱️ {runResult.execution_time_ms} ms</span>
                    )}
                  </div>

                  {runResult ? (
                    <div className="space-y-2">
                      {runResult.stdout && (
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-sans">
                            Standard Output (stdout):
                          </span>
                          <pre className="p-2 rounded bg-black/40 text-emerald-300 whitespace-pre-wrap">
                            {runResult.stdout}
                          </pre>
                        </div>
                      )}
                      {runResult.stderr && (
                        <div>
                          <span className="text-[10px] text-rose-400 block uppercase font-sans">
                            Standard Error (stderr):
                          </span>
                          <pre className="p-2 rounded bg-rose-950/30 border border-rose-500/20 text-rose-300 whitespace-pre-wrap">
                            {runResult.stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-600 italic">
                      กดปุ่ม "รันโค้ด" เพื่อทดสอบการทำงานกับอินพุตตัวอย่าง
                    </p>
                  )}
                </div>
              )}

              {activeBottomTab === "verdict" && (
                <div>
                  {submitting ? (
                    <div className="flex items-center space-x-2 text-indigo-400 py-4">
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span>กำลังส่งและตรวจคำตอบกับระบบ Sandbox...</span>
                    </div>
                  ) : submissionVerdict ? (
                    <div
                      className={`p-4 rounded-xl border space-y-2 ${
                        submissionVerdict.status === "ACCEPTED"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 glow-emerald"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-300 glow-rose"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {submissionVerdict.status === "ACCEPTED" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-400" />
                          )}
                          <span className="text-base font-bold">
                            {submissionVerdict.status}
                          </span>
                        </div>
                        <span className="text-sm font-bold">
                          +{submissionVerdict.score} คะแนน
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-[11px] text-slate-400 font-sans pt-1 border-t border-white/5">
                        <span>เวลาทำงาน: {submissionVerdict.executionTimeMs ?? 0} ms</span>
                        <span>
                          {submissionVerdict.status === "ACCEPTED"
                            ? "ผ่านการตรวจสอบครบทุก Test Cases!"
                            : "ผลลัพธ์ยังไม่ถูกต้อง ลองตรวจทานเงื่อนไขและส่งอีกครั้ง"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 italic">
                      กดปุ่ม "ส่งตรวจ (Submit)" เพื่อให้ระบบตรวจคำตอบกับชุดทดสอบทั้งหมด
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* First-time local code execution consent modal */}
      <LocalExecutionConsentModal
        isOpen={showConsentModal}
        onConsent={handleConsentApproved}
        onClose={() => {
          setShowConsentModal(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
};
