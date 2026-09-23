import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthContext";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { ErrorBoundary } from "../components/layout/ErrorBoundary";
import { AppRouter } from "./router";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
          <Navbar />
          <main className="flex-1">
            <ErrorBoundary>
              <AppRouter />
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
