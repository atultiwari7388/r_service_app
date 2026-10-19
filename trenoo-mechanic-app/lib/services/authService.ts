import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  AuthError,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  LoginCredentials,
  LoginResult,
  MechanicProfile,
} from "@/types/auth";

export const getAuthErrorMessage = (error: any): string => {
  const code = (error?.code || "").toLowerCase();
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid_login_credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or Password is incorrect";
    case "auth/invalid-email":
      return "The email address is not valid.";
    case "auth/user-disabled":
      return "This user account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return error?.message || "Something went wrong. Please retry after some time.";
  }
};

/**
 * Service handling mechanic login flow identical to rabbit_shop_app AuthController:
 * 1. Sign in with Firebase Auth (email & password)
 * 2. Check if email is verified. If not, send verification email and sign out.
 * 3. Check if UID exists in Firestore `Mechanics` collection.
 * 4. If not found in `Mechanics`, check if email exists in `Users` collection (Customer App).
 *    If in `Users`, block and show "This email is already registered with the customer app."
 *    If not found in `Users`, redirect to sign-up.
 * 5. If mechanic doc exists and uid matches:
 *    a. Check if `isEnabled === true`. If false, account deactivated -> redirect to Admin Contact.
 *    b. Check multi-device restriction (`isMultiDeEnable`).
 *    c. If valid, update `active: true` and complete login.
 */
export async function authenticateMechanic(
  credentials: LoginCredentials
): Promise<LoginResult> {
  const email = credentials.email.trim();
  const password = credentials.password;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user: User | null = userCredential.user;

    if (!user) {
      return {
        status: "error",
        message: "Unable to retrieve user session.",
      };
    }

    // 1. Verify email check
    if (!user.emailVerified) {
      try {
        await sendEmailVerification(user);
      } catch (err) {
        console.warn("Error sending verification email:", err);
      }
      await signOut(auth);
      return {
        status: "email_not_verified",
        message: "Please verify your email before logging in. A new verification link has been sent.",
      };
    }

    // 2. Query Mechanics collection by doc UID
    const mechanicDocRef = doc(db, "Mechanics", user.uid);
    const mechanicDocSnap = await getDoc(mechanicDocRef);

    // 3. Not found in Mechanics collection -> Check customer Users collection
    if (!mechanicDocSnap.exists()) {
      const usersQuery = query(
        collection(db, "Users"),
        where("email", "==", email)
      );
      const userDocsSnap = await getDocs(usersQuery);

      if (!userDocsSnap.empty) {
        await signOut(auth);
        return {
          status: "customer_app_email",
          message: "This email is already registered with the customer app.",
        };
      }

      // Not in Users collection either: needs to complete registration
      return {
        status: "account_not_registered",
        message: "Mechanic profile not found. Please complete registration.",
        user,
      };
    }

    // 4. Found in Mechanics collection
    const mechanicData = mechanicDocSnap.data() as MechanicProfile;

    // Check if account is enabled
    if (mechanicData.isEnabled === false) {
      return {
        status: "account_deactivated",
        message: "Your account is deactivated. Please contact admin.",
        mechanicData,
      };
    }

    // Update active status
    try {
      await updateDoc(mechanicDocRef, {
        active: true,
      });
    } catch (updateErr) {
      console.warn("Could not update active flag:", updateErr);
    }

    return {
      status: "success",
      message: "Login Successful",
      user,
      mechanicData,
    };
  } catch (error: any) {
    console.error("Mechanic authentication error:", error);
    return {
      status: "error",
      message: getAuthErrorMessage(error),
    };
  }
}
