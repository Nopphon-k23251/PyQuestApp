import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Code2,
  BookOpen,
  Terminal,
  Trophy,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User as UserIcon,
  X,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { progressApi } from "../../services/api/progressApi";
import { UserProgress } from "../../types";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    await logout();
    onCloseMobile();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/courses") {
      return location.pathname === "/courses" || location.pathname.startsWith("/courses/");
    }
    if (path === "/admin") {
      return location.pathname.startsWith("/admin");
    }
    return location.pathname === path;
  };

  const navItems = [
    {
      label: "หลักสูตร",
      subLabel: "Courses",
      path: "/courses",
      icon: BookOpen,
      color: "text-indigo-400",
      activeBg: "bg-indigo-600/15 text-indigo-300 border-indigo-500/30",
    },
    {
      label: "สนามทดลอง",
      subLabel: "Playground",
      path: "/playground",
      icon: Terminal,
      color: "text-emerald-400",
      activeBg: "bg-emerald-600/15 text-emerald-300 border-emerald-500/30",
    },
    ...(user
      ? [
          {
            label: "แดชบอร์ด",
            subLabel: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
            color: "text-sky-400",
            activeBg: "bg-sky-600/15 text-sky-300 border-sky-500/30",
          },
        ]
      : []),
    ...(user?.role === "ADMIN"
      ? [
          {
            label: "จัดการระบบ",
            subLabel: "Admin Panel",
            path: "/admin",
            icon: ShieldAlert,
            color: "text-rose-400",
            activeBg: "bg-rose-600/15 text-rose-300 border-rose-500/30",
          },
        ]
      : []),
  ];

  const totalPoints = progress?.totalPoints ?? (progress as any)?.total_points ?? 0;
  const solvedCount = progress?.solvedProblems ?? (progress as any)?.solved_problems ?? 0;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#080c16]/95 backdrop-blur-xl border-r border-white/[0.08] transition-all duration-300 ease-in-out ${
          // Mobile: slide in/out
          mobileOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${
          // Desktop: collapsed vs expanded
          collapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        {/* Top Header / Brand Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
          <Link
            to="/courses"
            onClick={onCloseMobile}
            className={`flex items-center space-x-3 group overflow-hidden ${
              collapsed ? "lg:justify-center lg:w-full" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
              <Code2 className="w-5 h-5 text-white" />
            </div>

            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  PyQuest
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    PRO
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate -mt-0.5">
                  Python Practice Lab
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 lg:hidden"
            title="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Points Pill (When logged in) */}
        {user && (!collapsed || mobileOpen) && (
          <div className="mx-3.5 my-3 p-3 rounded-xl bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">คะแนนสะสม</div>
                  <div className="text-sm font-bold text-amber-300">{totalPoints} pts</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-400 font-medium">ผ่านแล้ว</div>
                <div className="text-sm font-bold text-emerald-400">{solvedCount} ข้อ</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                title={collapsed && !mobileOpen ? `${item.label} (${item.subLabel})` : undefined}
                className={`flex items-center rounded-xl font-medium transition-all group border ${
                  collapsed && !mobileOpen
                    ? "justify-center p-3"
                    : "space-x-3 px-3.5 py-2.5"
                } ${
                  active
                    ? `${item.activeBg} shadow-sm font-semibold`
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    active ? item.color : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                {(!collapsed || mobileOpen) && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm leading-tight text-slate-200">{item.label}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">{item.subLabel}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: User Info / Auth / Collapse Toggle */}
        <div className="p-3 border-t border-white/[0.06] bg-[#060913]/90 space-y-2">
          {user ? (
            <div
              className={`flex items-center rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 ${
                collapsed && !mobileOpen ? "justify-center" : "justify-between"
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 border border-indigo-400/40 flex items-center justify-center text-white font-bold text-xs shadow-inner flex-shrink-0">
                  {(user.username || "U").charAt(0).toUpperCase()}
                </div>

                {(!collapsed || mobileOpen) && (
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-semibold text-white truncate">
                      {user.username || "Coder"}
                    </span>
                    <span className="text-[10px] text-indigo-300 font-medium">
                      {user.role === "ADMIN" ? "👑 ผู้ดูแลระบบ (Admin)" : "🎓 นิสิต (Student)"}
                    </span>
                  </div>
                )}
              </div>

              {(!collapsed || mobileOpen) && (
                <button
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Link
                to="/login"
                onClick={onCloseMobile}
                className={`flex items-center justify-center rounded-xl text-xs font-semibold py-2.5 transition-all ${
                  collapsed && !mobileOpen
                    ? "px-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {(!collapsed || mobileOpen) && <span>เข้าสู่ระบบ</span>}
              </Link>
            </div>
          )}

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "ขยายเมนู (Expand)" : "ย่อเมนู (Collapse)"}
            className="hidden lg:flex w-full items-center justify-center py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors text-xs"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center space-x-1.5 text-slate-400">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] font-medium">ย่อแถบเมนู</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
