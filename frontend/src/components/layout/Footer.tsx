import React from "react";
import { Terminal, Shield, Cpu } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/5 bg-[#05070b] py-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">Local Python Judge Engine:</span>
          <span className="text-emerald-400 font-mono">ONLINE (Isolated Subprocess)</span>
        </div>

        <div className="flex items-center space-x-6 text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Sandbox Security & Time Guard
          </span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            Python 3.12 / 3.14 Runtime
          </span>
          <span>© {new Date().getFullYear()} PyQuest Platform</span>
        </div>
      </div>
    </footer>
  );
};
