import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Code2, Lock, Mail, ArrowRight, Shield, Sparkles, Terminal } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";

export const LoginPage: React.FC = () => {
  const { login, loginDev } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/courses");
    } catch (err: any) {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ ตรวจสอบอีเมลหรือรหัสผ่าน");
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (type: "admin" | "student") => {
    setLoading(true);
    try {
      await loginDev(type);
      navigate("/courses");
    } catch (err: any) {
      setError(err.message || "Dev login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 p-8 rounded-2xl glass-panel border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glowing Background Blob */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Code2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            เข้าสู่ระบบ PyQuest
          </h2>
          <p className="text-sm text-slate-400">
            ระบบฝึกเขียนโปรแกรม Python สำหรับนิสิตและนักพัฒนา
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center space-x-2">
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              อีเมล (Email)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95"
          >
            <span>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Fast Dev / One-Click Test Accounts */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              บัญชีทดสอบทันที (One-Click Dev):
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDevLogin("student")}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500/50 text-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              User (ผู้เรียน)
            </button>
            <button
              type="button"
              onClick={() => handleDevLogin("admin")}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800/80 hover:bg-rose-600/30 border border-slate-700 hover:border-rose-500/50 text-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              Admin (ผู้ดูแล)
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            ยังไม่มีบัญชี?{" "}
            <Link to="/register" className="text-indigo-400 hover:underline font-semibold">
              สมัครสมาชิกใหม่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
