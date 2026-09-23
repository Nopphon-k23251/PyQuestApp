import React, { useState, useRef } from "react";
import {
  Play,
  RotateCcw,
  Upload,
  Download,
  Copy,
  Check,
  Trash2,
  Terminal,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Code2,
} from "lucide-react";
import { playgroundApi } from "../services/api/playgroundApi";
import { CodeRunResult } from "../services/api/problemApi";
import { LocalExecutionConsentModal } from "../components/feedback/LocalExecutionConsentModal";
import { CodeEditor } from "../components/editor/CodeEditor";

interface Snippet {
  name: string;
  description: string;
  code: string;
  defaultInput?: string;
}

const SNIPPETS: Snippet[] = [
  {
    name: "Hello, World!",
    description: "โปรแกรมเริ่มต้นพื้นฐานและการพิมพ์ข้อความ",
    code: `# Python 3.12 / 3.14 Playground
print("Hello, World!")
print("ยินดีต้อนรับสู่ PyQuest Python Playground 🚀")
`,
    defaultInput: "",
  },
  {
    name: "Standard Input (stdin)",
    description: "การรับค่าทางคีย์บอร์ดด้วยคำสั่ง input()",
    code: `# ทดสอบการรับค่าทาง stdin
name = input("กรุณากรอกชื่อ: ")
age = int(input("กรุณากรอกอายุ: "))
print(f"สวัสดีคุณ {name}! ในปีหน้าคุณจะมีอายุครบ {age + 1} ปี")
`,
    defaultInput: "สมชาย\n25",
  },
  {
    name: "Fibonacci Sequence",
    description: "การคำนวณและสร้างลำดับฟีโบนักชี",
    code: `# ฟังก์ชันสร้างลำดับ Fibonacci N ลำดับแรก
def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

n = int(input() or 10)
print(f"ลำดับ Fibonacci {n} ลำดับแรก:")
print(fibonacci(n))
`,
    defaultInput: "12",
  },
  {
    name: "Prime Number Sieve",
    description: "อัลกอริทึม Sieve of Eratosthenes หาจำนวนเฉพาะ",
    code: `# อัลกอริทึมหาจำนวนเฉพาะตั้งแต่ 2 ถึง limit
def find_primes(limit):
    is_prime = [True] * (limit + 1)
    primes = []
    for p in range(2, limit + 1):
        if is_prime[p]:
            primes.append(p)
            for i in range(p * p, limit + 1, p):
                is_prime[i] = False
    return primes

limit = int(input() or 50)
primes = find_primes(limit)
print(f"จำนวนเฉพาะทั้งหมดตั้งแต่ 2 ถึง {limit} (พบ {len(primes)} จำนวน):")
print(primes)
`,
    defaultInput: "50",
  },
  {
    name: "List Comprehension & Dict",
    description: "การเขียนประมวลผลข้อมูลแบบ Pythonic สั้นกระชับ",
    code: `# ตัวอย่างการใช้งาน List Comprehension และ Dict Comprehension
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# กรองเลขคู่และยกกำลังสอง
even_squares = [x**2 for x in numbers if x % 2 == 0]
print(f"เลขคู่ยกกำลังสอง: {even_squares}")

# สร้าง Dictionary แสดงผลคูณ
mult_table = {x: x * 5 for x in numbers[:5]}
print("สูตรคูณแม่ 5 (พจน์ 1-5):")
for k, v in mult_table.items():
    print(f"  5 x {k} = {v}")
`,
    defaultInput: "",
  },
  {
    name: "Math & Statistics",
    description: "การคำนวณสถิติพื้นฐาน (ค่าเฉลี่ย, มัธยฐาน)",
    code: `# สถิติพื้นฐานโดยไม่ใช้ External Libraries
data = [15, 23, 45, 67, 89, 90, 23, 45, 12, 78, 99]

mean = sum(data) / len(data)
sorted_data = sorted(data)
mid = len(sorted_data) // 2
median = sorted_data[mid] if len(sorted_data) % 2 != 0 else (sorted_data[mid - 1] + sorted_data[mid]) / 2

print(f"ชุดข้อมูล ({len(data)} ตัว): {data}")
print(f"ค่าน้อยสุด: {min(data)}, ค่ามากสุด: {max(data)}")
print(f"ค่าเฉลี่ย (Mean): {mean:.2f}")
print(f"ค่ามัธยฐาน (Median): {median:.2f}")
`,
    defaultInput: "",
  },
];

export const PlaygroundPage: React.FC = () => {
  const [code, setCode] = useState(() => {
    return localStorage.getItem("pyquest_playground_code") || SNIPPETS[0].code;
  });
  const [customInput, setCustomInput] = useState(() => {
    return localStorage.getItem("pyquest_playground_input") ?? (SNIPPETS[0].defaultInput || "");
  });
  const [selectedSnippet, setSelectedSnippet] = useState<string>(SNIPPETS[0].name);

  // Execution states
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  // Consent modal
  const [showConsentModal, setShowConsentModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lineCount = code.split("\n").length;

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    localStorage.setItem("pyquest_playground_code", newCode);
  };

  const handleCustomInputChange = (newInput: string) => {
    setCustomInput(newInput);
    localStorage.setItem("pyquest_playground_input", newInput);
  };

  const handleSnippetChange = (snippetName: string) => {
    const snip = SNIPPETS.find((s) => s.name === snippetName);
    if (snip) {
      setSelectedSnippet(snippetName);
      handleCodeChange(snip.code);
      if (snip.defaultInput !== undefined) {
        handleCustomInputChange(snip.defaultInput);
      }
    }
  };

  const handleResetPlayground = () => {
    if (window.confirm("คุณต้องการรีเซ็ต Playground เป็นค่าเริ่มต้นใช่หรือไม่?")) {
      const snip = SNIPPETS.find((s) => s.name === selectedSnippet) || SNIPPETS[0];
      handleCodeChange(snip.code);
      handleCustomInputChange(snip.defaultInput || "");
    }
  };

  // First-time consent check
  const checkConsent = (): boolean => {
    const hasConsented = localStorage.getItem("pyquest_local_exec_consent") === "true";
    if (!hasConsented) {
      setShowConsentModal(true);
      return false;
    }
    return true;
  };

  const handleConsentApproved = () => {
    localStorage.setItem("pyquest_local_exec_consent", "true");
    setShowConsentModal(false);
    executeRun();
  };

  const handleRun = () => {
    if (!checkConsent()) return;
    executeRun();
  };

  const executeRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    try {
      const res = await playgroundApi.runCode(code, customInput, 4000);
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

  // Keyboard shortcut (Ctrl+Enter to run, Tab to indent)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".py")) {
      alert("กรุณาเลือกไฟล์ .py เท่านั้น");
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

  // File Download
  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "playground_script.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleCopyOutput = () => {
    if (!runResult) return;
    const text = runResult.stdout || runResult.stderr || "";
    navigator.clipboard.writeText(text);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 1500);
  };

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Top Header & Snippet Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Terminal className="w-4 h-4" />
            <span>Python 3.12 / 3.14 Freeform Environment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>สนามทดลองเขียนโค้ด (Playground)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              Sandbox
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            เขียน ทดสอบอัลกอริทึม ลองฟังก์ชันใหม่ๆ และรับส่งค่า Standard Input ได้อย่างอิสระโดยไม่ต้องมีโจทย์กำกับ
          </p>
        </div>

        {/* Snippet Selector & Action Tools */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Snippet Dropdown */}
          <div className="flex items-center space-x-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <Code2 className="w-4 h-4 text-indigo-400 ml-2" />
            <select
              value={selectedSnippet}
              onChange={(e) => handleSnippetChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none pr-3 py-1 cursor-pointer"
            >
              {SNIPPETS.map((snip) => (
                <option key={snip.name} value={snip.name} className="bg-slate-900 text-white">
                  {snip.name}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Button */}
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
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>อัปโหลด .py</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownloadCode}
            title="ดาวน์โหลดโค้ดเป็นไฟล์ .py"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>บันทึก .py</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-auto lg:h-[calc(100vh-13.5rem)] lg:min-h-[640px]">
        {/* LEFT / CENTER: Code Editor (7 cols) */}
        <div className="lg:col-span-7 h-[550px] lg:h-full flex flex-col rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-2xl">
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-white/5">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white font-mono">
                main.py
              </span>
              <span className="text-[11px] text-slate-500">
                • {lineCount} บรรทัด
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyCode}
                title="คัดลอกโค้ดทั้งหมด"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 transition-colors"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>คัดลอกโค้ด</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-emerald-400/90 hidden sm:flex items-center space-x-1 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>บันทึกแบบร่างแล้ว</span>
              </span>

              <button
                type="button"
                onClick={() => handleCodeChange("")}
                title="ล้างโค้ดทั้งหมดใน Editor"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetPlayground}
                title="รีเซ็ตโค้ดกลับเป็นค่าเริ่มต้นของ Snippet นี้"
                className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-white/5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>รีเซ็ต</span>
              </button>

              {/* Main Run Button */}
              <button
                onClick={handleRun}
                disabled={running}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{running ? "กำลังประมวลผล..." : "รันโค้ด (Ctrl+Enter)"}</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Body */}
          <div className="flex-1 min-h-[450px] relative overflow-hidden p-2 bg-[#060911]">
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              language="python"
              onRun={handleRun}
            />
          </div>
        </div>

        {/* RIGHT: Input / Output Console (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Top Half: Standard Input (stdin) */}
          <div className="h-48 flex flex-col rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/80 border-b border-white/5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Standard Input (stdin)</span>
              </span>
              <button
                type="button"
                onClick={() => handleCustomInputChange("")}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
              >
                ล้าง Input
              </button>
            </div>

            <textarea
              value={customInput}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              placeholder="กรอกข้อมูลสำหรับคำสั่ง input() ที่นี่ (แยกแต่ละค่าด้วยบรรทัดใหม่หรือช่องว่าง)..."
              className="flex-1 p-3 bg-[#060911] text-emerald-300 font-mono text-xs leading-5 resize-none focus:outline-none placeholder-slate-600 overflow-y-auto"
            />
          </div>

          {/* Bottom Half: Execution Output (stdout & stderr) */}
          <div className="flex-1 flex flex-col rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-xl">
            {/* Output Header */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/80 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ผลการทำงาน (Terminal Output)</span>
                </span>
                {runResult && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      runResult.status === "ACCEPTED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : runResult.status === "TIME_LIMIT"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {runResult.status}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {runResult && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{runResult.execution_time_ms} ms</span>
                  </span>
                )}

                {runResult && (
                  <button
                    type="button"
                    onClick={handleCopyOutput}
                    title="คัดลอกผลลัพธ์ Output"
                    className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    {copiedOutput ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{copiedOutput ? "คัดลอกแล้ว" : "คัดลอก"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setRunResult(null)}
                  title="ล้างผลลัพธ์ Output"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Output Display Body */}
            <div className="flex-1 p-3 bg-[#060911] overflow-y-auto text-xs font-mono">
              {running ? (
                <div className="h-full flex items-center justify-center space-x-2.5 text-indigo-400">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="font-sans text-xs">กำลังประมวลผลโค้ดบน Sandbox...</span>
                </div>
              ) : runResult ? (
                <div className="space-y-3">
                  {runResult.stdout && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block mb-1">
                        Standard Output (stdout):
                      </span>
                      <pre className="p-2.5 rounded-lg bg-black/40 text-emerald-300 whitespace-pre-wrap leading-relaxed border border-white/5 overflow-x-auto">
                        {runResult.stdout}
                      </pre>
                    </div>
                  )}

                  {runResult.stderr && (
                    <div>
                      <span className="text-[10px] text-rose-400 uppercase font-sans font-semibold block mb-1">
                        Standard Error / Exception (stderr):
                      </span>
                      <pre className="p-2.5 rounded-lg bg-rose-950/20 text-rose-300 whitespace-pre-wrap leading-relaxed border border-rose-500/20 overflow-x-auto">
                        {runResult.stderr}
                      </pre>
                    </div>
                  )}

                  {!runResult.stdout && !runResult.stderr && (
                    <p className="text-slate-500 italic p-2">
                      (โปรแกรมทำงานสำเร็จโดยไม่มีการพิมพ์ข้อความออกมาทาง Output)
                    </p>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500">
                  <Terminal className="w-8 h-8 text-slate-700" />
                  <p className="text-xs">
                    กดปุ่ม <strong className="text-indigo-400 font-sans">"รันโค้ด"</strong> หรือกด{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">
                      Ctrl+Enter
                    </kbd>{" "}
                    เพื่อดูผลลัพธ์
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* First-time local execution consent modal */}
      <LocalExecutionConsentModal
        isOpen={showConsentModal}
        onConsent={handleConsentApproved}
        onClose={() => setShowConsentModal(false)}
      />
    </div>
  );
};
