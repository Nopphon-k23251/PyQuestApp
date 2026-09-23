import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { Footer } from "./Footer";
import { ErrorBoundary } from "./ErrorBoundary";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("pyquest_sidebar_collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("pyquest_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 flex flex-col lg:flex-row">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Mobile Header (sticky on top for small screens) */}
        <MobileHeader onOpenMobile={() => setMobileOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 flex flex-col overflow-x-hidden min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};
