import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl glass-panel bg-[#0d121f] border border-rose-500/20 p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {this.props.fallbackTitle || "เกิดข้อผิดพลาดในการแสดงผลหน้านี้"}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                ระบบตรวจพบข้อผิดพลาดที่ไม่คาดคิดในส่วนการแสดงผลข้อมูล
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/50 border border-rose-500/15 text-left text-xs font-mono text-rose-300 max-h-36 overflow-y-auto">
                <span className="font-bold text-rose-400 block mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </span>
                {this.state.error.stack && (
                  <span className="text-[10px] text-slate-500 whitespace-pre-wrap block">
                    {this.state.error.stack.split("\n").slice(0, 3).join("\n")}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีโหลดหน้านี้</span>
              </button>

              <a
                href="/courses"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/5 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>กลับหน้ารวมคอร์ส</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
