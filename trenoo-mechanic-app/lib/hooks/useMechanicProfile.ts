"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updatePassword, signOut } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContexts";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export interface ProfileFormData {
  userName: string;
  workshopName: string;
  cellPhone: string;
  telephone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  dateOfBirth: string;
  experience: string;
  description: string;
  perHCharge: number | string;
  active: boolean;
  languages: Record<string, boolean>;
}

const DEFAULT_LANGUAGES = ["English", "Hindi", "Punjabi", "Spanish", "French", "Arabic"];

export function useMechanicProfile() {
  const router = useRouter();
  const authContext = useAuth();
  const user = authContext?.user;
  const rawMechanic = authContext?.mechanicProfile;
  const refreshProfile = authContext?.refreshProfile;

  const [formData, setFormData] = useState<ProfileFormData>({
    userName: "",
    workshopName: "",
    cellPhone: "",
    telephone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    dateOfBirth: "",
    experience: "",
    description: "",
    perHCharge: "",
    active: true,
    languages: {},
  });

  const [wallet, setWallet] = useState<number>(0);
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(DEFAULT_LANGUAGES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [passwordState, setPasswordState] = useState({
    newPassword: "",
    confirmPassword: "",
    isUpdating: false,
  });

  // Fetch languages master list from metadata/languages
  const fetchMetadataLanguages = useCallback(async () => {
    try {
      const metaDoc = await getDoc(doc(db, "metadata", "languages"));
      if (metaDoc.exists()) {
        const metaData = metaDoc.data();
        const masterList = metaData?.data;
        if (Array.isArray(masterList) && masterList.length > 0) {
          const list = masterList.map((l) => String(l));
          list.sort((a, b) => a.localeCompare(b));
          setAvailableLanguages(list);
          return list;
        }
      }
    } catch (err) {
      console.warn("Could not load master languages metadata:", err);
    }
    return DEFAULT_LANGUAGES;
  }, []);

  // Sync form with mechanic profile
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const langs = await fetchMetadataLanguages();

      try {
        const docRef = doc(db, "Mechanics", user.uid);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists() && isMounted) {
          const data = snapshot.data();
          const savedLangs: Record<string, boolean> = data.languages || {};

          // Merge available languages
          const updatedLangs: Record<string, boolean> = {};
          langs.forEach((lang) => {
            updatedLangs[lang] = Boolean(savedLangs[lang]);
          });
          // Include any existing keys not in master list
          Object.keys(savedLangs).forEach((k) => {
            if (!(k in updatedLangs)) {
              updatedLangs[k] = Boolean(savedLangs[k]);
            }
          });

          setFormData({
            userName: data.userName || data.name || "",
            workshopName: data.workshopName || "",
            cellPhone: data.cellPhone || data.phoneNumber || "",
            telephone: data.telephone || "",
            email: data.email || user.email || "",
            address: data.address || data.lastAddress || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "",
            postalCode: data.postalCode || "",
            dateOfBirth: data.dateOfBirth || "",
            experience: data.experience || "",
            description: data.description || "",
            perHCharge: data.perHCharge ?? data.perHourCharge ?? "",
            active: data.active !== false,
            languages: updatedLangs,
          });

          setWallet(Number(data.wallet || 0));
          setProfilePicture(data.profilePicture || data.mDp || "");
        } else if (rawMechanic && isMounted) {
          setFormData({
            userName: rawMechanic.userName || rawMechanic.name || "",
            workshopName: rawMechanic.workshopName || "",
            cellPhone: rawMechanic.cellPhone || rawMechanic.phoneNumber || "",
            telephone: rawMechanic.telephone || "",
            email: rawMechanic.email || user.email || "",
            address: rawMechanic.address || "",
            city: rawMechanic.city || "",
            state: rawMechanic.state || "",
            country: rawMechanic.country || "",
            postalCode: rawMechanic.postalCode || "",
            dateOfBirth: rawMechanic.dateOfBirth || "",
            experience: rawMechanic.experience || "",
            description: rawMechanic.description || "",
            perHCharge: rawMechanic.perHourCharge ?? "",
            active: rawMechanic.active !== false,
            languages: rawMechanic.languages || {},
          });
          setWallet(Number(rawMechanic.wallet || 0));
          setProfilePicture(rawMechanic.profilePicture || rawMechanic.mDp || "");
        }
      } catch (err: any) {
        console.error("Error fetching mechanic doc:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, rawMechanic, fetchMetadataLanguages]);

  // Handle generic text inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle language selection
  const handleLanguageToggle = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: {
        ...prev.languages,
        [lang]: !prev.languages[lang],
      },
    }));
  };

  // Toggle active availability
  const handleActiveToggle = async (newActive: boolean) => {
    if (!user) return;
    setFormData((prev) => ({ ...prev, active: newActive }));
    try {
      await updateDoc(doc(db, "Mechanics", user.uid), {
        active: newActive,
        updated_at: serverTimestamp(),
      });
      toast.success(
        newActive ? "Status set to Available / Online" : "Status set to Offline / Busy"
      );
    } catch (err) {
      toast.error("Failed to update status toggle");
    }
  };

  // Upload Profile Picture
  const handleImageUpload = async (file: File) => {
    if (!user) {
      toast.error("Please log in first");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    const toastId = toast.loading("Uploading photo...");

    try {
      const storageRef = ref(
        storage,
        `profile_images/${user.uid}/profile_pic_${Date.now()}.jpg`
      );
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      await updateDoc(doc(db, "Mechanics", user.uid), {
        profilePicture: downloadUrl,
        mDp: downloadUrl,
        updated_at: serverTimestamp(),
      });

      setProfilePicture(downloadUrl);
      if (refreshProfile) refreshProfile();

      toast.success("Profile photo updated!", { id: toastId });
    } catch (err: any) {
      console.error("Photo upload error:", err);
      toast.error(err.message || "Failed to upload photo", { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Save full profile details to Firestore
  const saveProfile = async () => {
    if (!user) {
      toast.error("You must be logged in to update your profile.");
      return;
    }

    if (!formData.userName.trim()) {
      toast.error("Full Name / Mechanic Name is required.");
      return;
    }

    if (!formData.workshopName.trim()) {
      toast.error("Workshop Name is required.");
      return;
    }

    if (!formData.cellPhone.trim()) {
      toast.error("Phone number is required.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving changes to profile...");

    try {
      const perHourChargeNum = Number(formData.perHCharge) || 0;

      const updatePayload: Record<string, any> = {
        userName: formData.userName.trim(),
        name: formData.userName.trim(),
        workshopName: formData.workshopName.trim(),
        cellPhone: formData.cellPhone.trim(),
        phoneNumber: formData.cellPhone.trim(),
        telephone: formData.telephone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postalCode: formData.postalCode.trim(),
        dateOfBirth: formData.dateOfBirth.trim(),
        experience: formData.experience.trim(),
        description: formData.description.trim(),
        perHCharge: perHourChargeNum,
        perHourCharge: perHourChargeNum,
        languages: formData.languages,
        active: formData.active,
        updated_at: serverTimestamp(),
      };

      await updateDoc(doc(db, "Mechanics", user.uid), updatePayload);

      if (refreshProfile) refreshProfile();
      toast.success("Profile updated successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Failed to update profile", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Change Password
  const handlePasswordChange = async () => {
    if (!auth.currentUser) {
      toast.error("No authenticated user found");
      return;
    }

    if (passwordState.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setPasswordState((prev) => ({ ...prev, isUpdating: true }));
    const toastId = toast.loading("Updating password...");

    try {
      await updatePassword(auth.currentUser, passwordState.newPassword);
      toast.success("Password changed successfully!", { id: toastId });
      setPasswordState({
        newPassword: "",
        confirmPassword: "",
        isUpdating: false,
      });
    } catch (err: any) {
      console.error("Password update error:", err);
      if (err.code === "auth/requires-recent-login") {
        toast.error("Please log out and sign in again before changing your password.", {
          id: toastId,
        });
      } else {
        toast.error(err.message || "Failed to update password", { id: toastId });
      }
      setPasswordState((prev) => ({ ...prev, isUpdating: false }));
    }
  };

  // Temporarily Deactivate Account (Matching Flutter implementation)
  const deactivateAccount = async () => {
    if (!user) return;
    const toastId = toast.loading("Deactivating account...");

    try {
      await updateDoc(doc(db, "Mechanics", user.uid), {
        status: "deactivated",
        active: false,
        fcmToken: null,
        deactivatedAt: serverTimestamp(),
      });

      await signOut(auth);
      toast.success("Account temporarily deactivated", { id: toastId });
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate account", { id: toastId });
    }
  };

  // Permanently Delete Account (Matching Flutter implementation)
  const deleteAccountPermanently = async () => {
    if (!user) return;
    const toastId = toast.loading("Deleting account permanently...");

    try {
      // 1. Archive to deletedMembers
      const userDoc = await getDoc(doc(db, "Mechanics", user.uid));
      if (userDoc.exists()) {
        await setDoc(doc(db, "deletedMembers", user.uid), {
          ...userDoc.data(),
          deletedAt: serverTimestamp(),
          originalId: user.uid,
        });
      }

      // 2. Delete Firestore Mechanic doc
      await deleteDoc(doc(db, "Mechanics", user.uid));

      // 3. Delete Firebase Auth user
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }

      toast.success("Account deleted permanently", { id: toastId });
      router.push("/login");
    } catch (err: any) {
      console.error("Permanent deletion error:", err);
      if (err.code === "auth/requires-recent-login") {
        toast.error("Please log in again before deleting your account.", {
          id: toastId,
        });
      } else {
        toast.error(err.message || "Failed to delete account", { id: toastId });
      }
    }
  };

  return {
    user,
    formData,
    wallet,
    profilePicture,
    availableLanguages,
    isLoading,
    isSaving,
    isUploadingPhoto,
    passwordState,
    setPasswordState,
    handleInputChange,
    handleLanguageToggle,
    handleActiveToggle,
    handleImageUpload,
    saveProfile,
    handlePasswordChange,
    deactivateAccount,
    deleteAccountPermanently,
  };
}
