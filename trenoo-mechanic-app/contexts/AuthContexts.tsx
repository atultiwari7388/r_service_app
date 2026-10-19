"use client";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { MechanicProfile } from "@/types/auth";

export interface AuthContextType {
  user: User | undefined | null;
  mechanicProfile: MechanicProfile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextProviderProps {
  children: ReactNode;
}

export default function AuthContextProvider({
  children,
}: AuthContextProviderProps) {
  const [user, setUser] = useState<User | undefined | null>(undefined);
  const [mechanicProfile, setMechanicProfile] =
    useState<MechanicProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsProfileLoading(true);

        // Real-time listener for Mechanic profile document
        const docRef = doc(db, "Mechanics", firebaseUser.uid);
        unsubscribeDoc = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setMechanicProfile({
                uid: docSnap.id,
                ...docSnap.data(),
              } as MechanicProfile);
            } else {
              setMechanicProfile(null);
            }
            setIsProfileLoading(false);
          },
          (err) => {
            console.warn("Error listening to mechanic profile:", err);
            setIsProfileLoading(false);
          }
        );
      } else {
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
        setUser(null);
        setMechanicProfile(null);
        setIsProfileLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "Mechanics", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMechanicProfile({
          uid: docSnap.id,
          ...docSnap.data(),
        } as MechanicProfile);
      }
    } catch (err) {
      console.warn("Failed to refresh profile:", err);
    }
  }, [user]);

  // Define the logout function
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("SignOut error:", err);
    } finally {
      setUser(null);
      setMechanicProfile(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        mechanicProfile,
        isLoading: user === undefined || isProfileLoading,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
