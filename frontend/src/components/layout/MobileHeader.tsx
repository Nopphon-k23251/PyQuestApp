import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Code2, Trophy } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { progressApi } from "../../services/api/progressApi";
import { UserProgress } from "../../types";

interface MobileHeaderProps {
  onOpenMobile: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenMobile }) => {
  const { user } = useAuth();
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

  const totalPoints = progress?.totalPoints ?? (progress as any)?.total_points ?? 0;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#080c16]/90 backdrop-blur-md border-b border-white/[0.08] lg:hidden">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors active:scale-95"
          aria-label="เปิดเมนู"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/courses" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">PyQuest</span>
        </Link>
      </div>

      {/* Right: Points or Login */}
      <div className="flex items-center space-x-2.5">
        {user ? (
          <>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-amber-300 font-semibold shadow-inner">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalPoints}</span>
            </div>

            <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
              {(user.username || "U").charAt(0).toUpperCase()}
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </header>
  );
};
