import React, { useState, useEffect } from "react";
import { Terminal, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onConsent: () => void;
  onClose: () => void;
}

export const LocalExecutionConsentModal: React.FC<Props> = ({
  isOpen,
  onConsent,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 rounded-2xl glass-panel border border-indigo-500/30 shadow-2xl bg-[#0d121f]">
        {/* Glow Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              ตรวจและรันโค้ดบนเครื่องของคุณ (Local Python Sandbox)
            </h3>
            <p className="text-xs text-indigo-300 font-medium">
              ขออนุญาตประมวลผลโค้ด Python ก่อนเริ่มใช้งานครั้งแรก
            </p>
          </div>
        </div>

        {/* Details Card */}
        <div className="space-y-3 mb-6 text-sm text-slate-300">
          <p className="leading-relaxed">
            ระบบ PyQuest ตรวจและรันโค้ด Python ผ่านกระบวนการแยกส่วน (Isolated Subprocess)
            บนเครื่องของคุณโดยตรง <span className="text-emerald-400 font-semibold">ไม่ต้องใช้ Docker</span>
          </p>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>
                <strong>ระบบความปลอดภัย:</strong> แยกโฟลเดอร์ทำงานชั่วคราวและล้างข้อมูลหลังรันเสร็จ
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <span>
                <strong>จำกัดเวลา (Time Limit):</strong> ป้องกันคำสั่งวนลูปไม่รู้จบ (Infinite Loop) อัตโนมัติ
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <span>
                <strong>การอนุญาต:</strong> ระบบจะจดจำการตัดสินใจนี้ และจะไม่ถามซ้ำในการส่งตรวจครั้งต่อไป
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors rounded-lg"
          >
            ยกเลิก (Cancel)
          </button>
          <button
            onClick={onConsent}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>อนุญาตและเริ่มตรวจ (Allow & Continue)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
