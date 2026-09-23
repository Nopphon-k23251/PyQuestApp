import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  onAuthStateChanged,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  FirebaseUser,
} from "../../services/firebase";
import { authApi } from "../../services/api/authApi";
import { User } from "../../types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, username: string) => Promise<void>;
  loginDev: (type: "admin" | "student") => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  firebaseUser: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  loginDev: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncBackendUser = async (defaultUsername = "coder") => {
    try {
      // 1. Try to fetch existing user profile
      const profile = await authApi.getMe();
      setUser(profile);
    } catch (err: any) {
      // 2. If user profile doesn't exist yet in backend, sync/create it
      try {
        const synced = await authApi.syncUser(defaultUsername);
        setUser(synced.user);
      } catch (syncErr) {
        console.error("Failed to sync user with backend:", syncErr);
        setUser(null);
      }
    }
  };

  useEffect(() => {
    // Check if dev token is present
    const devToken = localStorage.getItem("pyquest_dev_token");
    if (devToken) {
      syncBackendUser().finally(() => setLoading(false));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const username = fbUser.displayName || fbUser.email?.split("@")[0] || "coder";
        await syncBackendUser(username);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    localStorage.removeItem("pyquest_dev_token");
    const cred = await signInWithEmail(email, pass);
    setFirebaseUser(cred.user);
    const username = cred.user.displayName || email.split("@")[0];
    await syncBackendUser(username);
  };

  const register = async (email: string, pass: string, username: string) => {
    localStorage.removeItem("pyquest_dev_token");
    const cred = await signUpWithEmail(email, pass);
    setFirebaseUser(cred.user);
    await syncBackendUser(username);
  };

  const loginDev = async (type: "admin" | "student") => {
    const token = type === "admin" ? "dev_admin_token" : "dev_student_token";
    localStorage.setItem("pyquest_dev_token", token);
    const defaultUsername = type === "admin" ? "admin" : "student";
    await syncBackendUser(defaultUsername);
  };

  const logout = async () => {
    localStorage.removeItem("pyquest_dev_token");
    try {
      await signOutUser();
    } catch {
      // Ignore if not logged in via Firebase
    }
    setFirebaseUser(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (user || localStorage.getItem("pyquest_dev_token") || auth.currentUser) {
      await syncBackendUser();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        login,
        register,
        loginDev,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
};
