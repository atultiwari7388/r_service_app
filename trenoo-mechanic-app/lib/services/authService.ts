import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
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
  MechanicRegistrationData,
  RegistrationResult,
} from "@/types/auth";

export const getAuthErrorMessage = (error: any): string => {
  const code = (error?.code || "").toLowerCase();
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid_login_credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or Password is incorrect";
    case "auth/email-already-in-use":
      return "The email is already in use by another account.";
    case "auth/invalid-email":
      return "The email address is invalid.";
    case "auth/weak-password":
      return "The password is too weak. Must be at least 6 characters.";
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
 * Fetch available languages from Firestore `metadata/languages`.
 * Falls back to default list if not configured in Firestore.
 */
export async function fetchMetadataLanguages(): Promise<string[]> {
  const defaults = ["English", "Hindi", "Punjabi", "Spanish"];
  try {
    const docSnap = await getDoc(doc(db, "metadata", "languages"));
    if (docSnap.exists() && docSnap.data()) {
      const dataMap = docSnap.data() as { data?: any[] };
      if (Array.isArray(dataMap.data) && dataMap.data.length > 0) {
        const list = dataMap.data.map((item) => String(item));
        return list.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      }
    }
  } catch (err) {
    console.warn("Error fetching metadata languages:", err);
  }
  return defaults.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

/**
 * Service handling mechanic registration identical to rabbit_shop_app AuthController:
 * 1. Create user in Firebase Auth with email & password.
 * 2. Save complete profile document in Firestore `Mechanics/{uid}`.
 * 3. Send email verification to the user.
 * 4. Sign out immediately to prevent unverified login.
 */
export async function registerMechanic(
  data: MechanicRegistrationData
): Promise<RegistrationResult> {
  const email = data.email.trim();
  const password = data.password;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user) {
      return {
        success: false,
        message: "Failed to create user account.",
      };
    }

    // Save mechanic document in Firestore Mechanics collection
    const mechanicDocRef = doc(db, "Mechanics", user.uid);
    const now = new Date();

    await setDoc(mechanicDocRef, {
      uid: user.uid,
      email: email,
      userName: data.name.trim(),
      workshopName: data.workshopName.trim(),
      cellPhone: data.cellPhone.trim(),
      telephone: data.telephone?.trim() || "",
      address: data.address?.trim() || "",
      city: data.city.trim(),
      state: data.state.trim(),
      country: data.country.trim(),
      postalCode: data.postalCode?.trim() || "",
      dateOfBirth: data.dateOfBirth?.trim() || "",
      experience: data.experience?.trim() || "",
      description: data.description?.trim() || "",
      perHCharge: 0,
      lastAddress: "",
      languages: data.languages,
      location: {
        latitude: 0,
        longitude: 0,
      },
      profilePicture:
        "https://firebasestorage.googleapis.com/v0/b/rabbit-service-d3d90.appspot.com/o/profile.png?alt=media&token=43b149e9-b4ee-458f-8271-5946b77ff658",
      isNotificationOn: true,
      wallet: 0,
      active: true,
      isEnabled: true,
      isMultiDeEnable: false,
      fcmToken: null,
      selected_services: [],
      created_at: now,
      updated_at: now,
    });

    // Send email verification
    try {
      await sendEmailVerification(user);
    } catch (verErr) {
      console.warn("Error sending verification email during registration:", verErr);
    }

    // Sign out to enforce email verification
    await signOut(auth);

    return {
      success: true,
      message: "A verification email has been sent to your email address. Please verify it before logging in.",
      user,
    };
  } catch (error: any) {
    console.error("Mechanic registration error:", error);
    return {
      success: false,
      message: getAuthErrorMessage(error),
    };
  }
}

/**
 * Service handling mechanic login flow identical to rabbit_shop_app AuthController.
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

/**
 * Service handling password reset identical to rabbit_shop_app AuthController:
 * sends password reset email with Firebase Auth.
 */
export async function resetPasswordWithEmail(
  email: string
): Promise<{ success: boolean; message: string }> {
  const trimmed = email.trim();
  if (!trimmed) {
    return {
      success: false,
      message: "Please enter your email address",
    };
  }

  try {
    await sendPasswordResetEmail(auth, trimmed);
    return {
      success: true,
      message: "Password reset email sent successfully",
    };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return {
      success: false,
      message: getAuthErrorMessage(error),
    };
  }
}
