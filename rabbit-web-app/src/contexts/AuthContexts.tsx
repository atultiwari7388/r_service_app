"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// Define types for the context value
interface AuthContextType {
  user: User | null; // User is either a User object or null
  isLoading: boolean; // Is the app still loading user data?
}

// Create the context with an initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextProviderProps {
  children: ReactNode; // Type for React children
}

export default function AuthContextProvider({
  children,
}: AuthContextProviderProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined); // We allow undefined initially

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user || null); // If user exists, set user, otherwise set null
    });

    return () => unsub(); // Cleanup on unmount
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: user === undefined, // If user is undefined, it's still loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }

  return context;
};
