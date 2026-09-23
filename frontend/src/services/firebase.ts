import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// Exact configuration provided by user
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDzCkfpVumte994Yv9GpalDAp9eXeT7SdM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nopphonapp-d0c5b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nopphonapp-d0c5b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nopphonapp-d0c5b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1046779447829",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1046779447829:web:10092ca90d01fec3465c1c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DS0RDZ80H0",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signUpWithEmail = (email: string, pass: string) => {
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const signInWithEmail = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const signOutUser = () => {
  return signOut(auth);
};

export const getIdToken = async (): Promise<string | null> => {
  // Check if active dev user bypass is stored in localStorage
  const devToken = localStorage.getItem("pyquest_dev_token");
  if (devToken) {
    return devToken;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken();
};

export { onAuthStateChanged };
export type { FirebaseUser };
