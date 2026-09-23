import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../features/auth/AuthContext";
import { AppLayout } from "../components/layout/AppLayout";
import { AppRouter } from "./router";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <AppRouter />
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
