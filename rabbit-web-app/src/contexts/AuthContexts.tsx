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
import {
  checkHasActiveSubscription,
  isUserTeamMember,
  isUserOwner,
} from "@/lib/services/subscriptionService";

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
  const [isOwnerDocLoading, setIsOwnerDocLoading] = useState(false);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        setIsProfileLoading(true);
      } else {
        setUser(null);
        setUserData(null);
        setCompanyOwnerSubscriptionActive(false);
        setEffectiveOwnerId("");
        setIsProfileLoading(false);
        setIsOwnerDocLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Real-time listener for current user document in `Users/{uid}`
  useEffect(() => {
    if (!user) {
      setUserData(null);
      setIsProfileLoading(false);
      setIsOwnerDocLoading(false);
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

          const isMember = isUserTeamMember(data, user.uid);

          if (isMember && data.createdBy && data.createdBy !== user.uid) {
            setEffectiveOwnerId(data.createdBy);
            setIsOwnerDocLoading(true);
          } else {
            setEffectiveOwnerId(user.uid);
            setIsOwnerDocLoading(false);
          }
        } else {
          setUserData(null);
          setIsOwnerDocLoading(false);
        }
        setIsProfileLoading(false);
      },
      (err) => {
        console.error("AuthContexts: Error listening to user profile:", err);
        setIsProfileLoading(false);
        setIsOwnerDocLoading(false);
      }
    );

    return () => unsubUser();
  }, [user]);

  // 3. If user is a team member, listen to their Company Owner's subscription status in real-time
  useEffect(() => {
    if (!effectiveOwnerId || !user || effectiveOwnerId === user.uid) {
      setCompanyOwnerSubscriptionActive(false);
      setIsOwnerDocLoading(false);
      return;
    }

    setIsOwnerDocLoading(true);
    const ownerDocRef = doc(db, "Users", effectiveOwnerId);
    const unsubOwner = onSnapshot(
      ownerDocRef,
      (ownerSnap) => {
        if (ownerSnap.exists()) {
          const ownerData = ownerSnap.data();
          const hasPlan = checkHasActiveSubscription(ownerData);
          setCompanyOwnerSubscriptionActive(hasPlan);
        } else {
          setCompanyOwnerSubscriptionActive(false);
        }
        setIsOwnerDocLoading(false);
      },
      (err) => {
        console.error("AuthContexts: Error listening to company owner profile:", err);
        setCompanyOwnerSubscriptionActive(false);
        setIsOwnerDocLoading(false);
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
    setIsOwnerDocLoading(false);
  };

  const isMember = isUserTeamMember(userData, user?.uid);
  const isOwner = !isMember && isUserOwner(userData, user?.uid);
  const isTeamMember = isMember;

  const isAdminUser = Boolean(user && isAllowedAdminEmail(user.email));
  const isSubscriptionBypassed = Boolean(
    (user?.email && isSubscriptionBypassedEmail(user.email)) ||
    (userData?.email && isSubscriptionBypassedEmail(userData.email))
  );
  const isDirectlyPurchased = checkHasActiveSubscription(userData);

  // Subscription is active if:
  // 1. Current user email is bypassed (e.g. atul2.mylexinfotech@gmail.com)
  // 2. Current user THEMSELVES directly has an active subscription
  // 3. For a Team Member: their Company Owner has an active subscription
  const isSubscriptionActive =
    isSubscriptionBypassed ||
    isDirectlyPurchased ||
    (isTeamMember && companyOwnerSubscriptionActive === true);

  // Complete hydration wait: wait for profile loading AND company owner profile loading for team members!
  const isLoading =
    user === undefined ||
    (Boolean(user) && (userData === null || isProfileLoading || (isTeamMember && isOwnerDocLoading)));

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
