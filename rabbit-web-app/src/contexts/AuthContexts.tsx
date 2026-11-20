"use client";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import RouteGuard from "@/components/RouteGuard";
import { ProfileValues } from "@/types/types";
import { isAllowedAdminEmail, isSubscriptionBypassedEmail } from "@/lib/adminConfig";

// Define types for the context value
export interface AuthContextType {
  user: User | undefined | null;
  userData: ProfileValues | null;
  isLoading: boolean;
  isSubscriptionActive: boolean;
  isOwner: boolean;
  isTeamMember: boolean;
  companyOwnerSubscriptionActive: boolean;
  effectiveOwnerId: string;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextProviderProps {
  children: ReactNode;
}

export default function AuthContextProvider({
  children,
}: AuthContextProviderProps) {
  const [user, setUser] = useState<User | undefined | null>(undefined);
  const [userData, setUserData] = useState<ProfileValues | null>(null);
  const [companyOwnerSubscriptionActive, setCompanyOwnerSubscriptionActive] = useState(false);
  const [effectiveOwnerId, setEffectiveOwnerId] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
      } else {
        setUser(null);
        setUserData(null);
        setCompanyOwnerSubscriptionActive(false);
        setEffectiveOwnerId("");
        setIsProfileLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Real-time listener for current user document in `Users/{uid}`
  useEffect(() => {
    if (!user) {
      setUserData(null);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);
    const userDocRef = doc(db, "Users", user.uid);
    const unsubUser = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ProfileValues;
          setUserData(data);

          const isMember =
            data.isTeamMember === true ||
            (data.role && data.role !== "Owner" && data.role !== "owner");

          if (isMember && data.createdBy && data.createdBy !== user.uid) {
            setEffectiveOwnerId(data.createdBy);
          } else {
            setEffectiveOwnerId(user.uid);
          }
        } else {
          setUserData(null);
        }
        setIsProfileLoading(false);
      },
      (err) => {
        console.error("AuthContexts: Error listening to user profile:", err);
        setIsProfileLoading(false);
      }
    );

    return () => unsubUser();
  }, [user]);

  // 3. If user is a team member, listen to their Company Owner's subscription status in real-time
  useEffect(() => {
    if (!effectiveOwnerId || !user || effectiveOwnerId === user.uid) {
      setCompanyOwnerSubscriptionActive(false);
      return;
    }

    const ownerDocRef = doc(db, "Users", effectiveOwnerId);
    const unsubOwner = onSnapshot(
      ownerDocRef,
      (ownerSnap) => {
        if (ownerSnap.exists()) {
          const ownerData = ownerSnap.data();
          const hasPlan = ownerData?.isSubscriptionPurchase === true;
          setCompanyOwnerSubscriptionActive(hasPlan);
        } else {
          setCompanyOwnerSubscriptionActive(false);
        }
      },
      (err) => {
        console.error("AuthContexts: Error listening to company owner profile:", err);
        setCompanyOwnerSubscriptionActive(false);
      }
    );

    return () => unsubOwner();
  }, [effectiveOwnerId, user]);

  // Logout function
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setCompanyOwnerSubscriptionActive(false);
    setEffectiveOwnerId("");
  };

  const isOwner =
    userData?.role === "Owner" ||
    userData?.role === "owner" ||
    (userData?.isOwner === true && !userData?.isTeamMember);

  const isTeamMember =
    userData?.isTeamMember === true ||
    (!isOwner && Boolean(userData?.role && userData.role !== "Guest"));

  const isAdminUser = Boolean(user && isAllowedAdminEmail(user.email));
  const isSubscriptionBypassed = Boolean(user && isSubscriptionBypassedEmail(user.email));
  const isDirectlyPurchased = userData?.isSubscriptionPurchase === true;
  const isTeamMemberUser =
    userData?.isTeamMember === true &&
    Boolean(userData?.createdBy && userData.createdBy !== user?.uid);

  // Subscription is active if user has directly purchased, or is team member of active owner,
  // or is an authorized Co-Owner bypass email (atul2.mylexinfotech@gmail.com)
  const isSubscriptionActive =
    isSubscriptionBypassed ||
    (isTeamMemberUser
      ? companyOwnerSubscriptionActive === true
      : isDirectlyPurchased);

  const isLoading = user === undefined || (Boolean(user) && isProfileLoading);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        isLoading,
        isSubscriptionActive,
        isOwner,
        isTeamMember,
        companyOwnerSubscriptionActive,
        effectiveOwnerId,
        logout,
      }}
    >
      <RouteGuard>{children}</RouteGuard>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
