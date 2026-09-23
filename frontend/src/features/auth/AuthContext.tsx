import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  onAuthStateChanged,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
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
  loginWithGoogle: () => Promise<void>;
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
  loginWithGoogle: async () => {},
  register: async () => {},
  loginDev: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

const ADMIN_EMAILS = ["nopphon052k@gmail.com", "admin@pyquest.com"];

const createFallbackUser = (fbUser: FirebaseUser): User => {
  const email = fbUser.email || "";
  const isAdmin = ADMIN_EMAILS.some((ae) => ae.toLowerCase() === email.toLowerCase());
  return {
    id: 1,
    email: email,
    username: fbUser.displayName || email.split("@")[0] || "coder",
    role: isAdmin ? "ADMIN" : "USER",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
};

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
        console.warn("Backend sync pending/delayed, using active Firebase session:", syncErr);
        if (auth.currentUser) {
          setUser(createFallbackUser(auth.currentUser));
        }
      }
    }
  };

  useEffect(() => {
    // Always clear legacy dev bypass token from localStorage
    localStorage.removeItem("pyquest_dev_token");

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Set user immediately from Firebase info so the UI enters account without delay
        setUser(createFallbackUser(fbUser));
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
    setUser(createFallbackUser(cred.user));
    const username = cred.user.displayName || email.split("@")[0];
    await syncBackendUser(username);
  };

  const loginWithGoogle = async () => {
    localStorage.removeItem("pyquest_dev_token");
    const cred = await signInWithGoogle();
    setFirebaseUser(cred.user);
    setUser(createFallbackUser(cred.user));
    const username = cred.user.displayName || cred.user.email?.split("@")[0] || "coder";
    await syncBackendUser(username);
  };

  const register = async (email: string, pass: string, username: string) => {
    localStorage.removeItem("pyquest_dev_token");
    const cred = await signUpWithEmail(email, pass);
    setFirebaseUser(cred.user);
    setUser(createFallbackUser(cred.user));
    await syncBackendUser(username);
  };

  const loginDev = async (_type: "admin" | "student") => {
    // Deprecated in production
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
    if (auth.currentUser) {
      const username = auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "coder";
      await syncBackendUser(username);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        login,
        loginWithGoogle,
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
