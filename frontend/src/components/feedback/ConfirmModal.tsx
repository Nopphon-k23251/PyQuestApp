import React, { useEffect } from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from "lucide-react";

export type ConfirmModalType = "danger" | "warning" | "info" | "success";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmModalType;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  type = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || loading) return;
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const getTheme = () => {
    switch (type) {
      case "danger":
        return {
          icon: AlertTriangle,
          iconBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
          btnColor: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30",
          glow: "bg-rose-600/10",
        };
      case "warning":
        return {
          icon: AlertCircle,
          iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
          btnColor: "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30",
          glow: "bg-amber-600/10",
        };
      case "success":
        return {
          icon: CheckCircle2,
          iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
          btnColor: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30",
          glow: "bg-emerald-600/10",
        };
      case "info":
      default:
        return {
          icon: Info,
          iconBg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
          btnColor: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30",
          glow: "bg-indigo-600/10",
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={loading ? undefined : onCancel}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-[#0b0f19] border border-white/10 p-6 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Ambient Glow */}
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${theme.glow}`}
        />

        {/* Close Button */}
        <button
          onClick={loading ? undefined : onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-4">
          {/* Icon Badge */}
          <div className={`p-3 rounded-2xl flex-shrink-0 ${theme.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>

          {/* Text Content */}
          <div className="space-y-1.5 flex-1 pr-6">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1.5 ${theme.btnColor}`}
          >
            {loading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
