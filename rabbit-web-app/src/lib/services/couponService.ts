import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Coupon,
  CouponTargetAudience,
  CouponValidationResult,
} from "@/types/coupon";

const COUPONS_COLLECTION = "coupons";

/**
 * Fetch all coupons sorted by creation date (newest first)
 */
export async function getCoupons(): Promise<Coupon[]> {
  try {
    const colRef = collection(db, COUPONS_COLLECTION);
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list: Coupon[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as Coupon), id: docSnap.id });
    });
    return list;
  } catch {
    // Fallback if index isn't created yet
    const colRef = collection(db, COUPONS_COLLECTION);
    const snap = await getDocs(colRef);
    const list: Coupon[] = [];
    snap.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as Coupon), id: docSnap.id });
    });
    list.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    return list;
  }
}

/**
 * Create a new coupon
 */
export async function createCoupon(
  couponData: Omit<Coupon, "id" | "usedCount" | "createdAt" | "updatedAt">
): Promise<string> {
  const cleanCode = couponData.code.trim().toUpperCase();

  // Check if coupon code already exists
  const existingQ = query(
    collection(db, COUPONS_COLLECTION),
    where("code", "==", cleanCode)
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    throw new Error(`Coupon with code "${cleanCode}" already exists.`);
  }

  const now = Timestamp.now();
  const payload: Omit<Coupon, "id"> = {
    ...couponData,
    code: cleanCode,
    description: couponData.description.trim(),
    discountType: couponData.discountType,
    discountValue: Number(couponData.discountValue) || 0,
    targetAudience: couponData.targetAudience,
    isNoLimit: Boolean(couponData.isNoLimit),
    minAmount: couponData.isNoLimit ? null : Number(couponData.minAmount) || null,
    maxDiscountAmount: couponData.isNoLimit
      ? null
      : Number(couponData.maxDiscountAmount) || null,
    neverExpires: Boolean(couponData.neverExpires),
    startDate: couponData.startDate || null,
    expiryDate: couponData.neverExpires ? null : couponData.expiryDate || null,
    usageLimit: couponData.usageLimit ? Number(couponData.usageLimit) : null,
    perUserLimit: couponData.perUserLimit ? Number(couponData.perUserLimit) : 1,
    usedCount: 0,
    isActive: couponData.isActive !== false,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COUPONS_COLLECTION), payload);
  return docRef.id;
}

/**
 * Update an existing coupon
 */
export async function updateCoupon(
  id: string,
  couponData: Partial<Coupon>
): Promise<void> {
  const docRef = doc(db, COUPONS_COLLECTION, id);

  const updates: Record<string, any> = {
    ...couponData,
    updatedAt: Timestamp.now(),
  };

  if (couponData.code) {
    updates.code = couponData.code.trim().toUpperCase();
  }
  if (couponData.isNoLimit !== undefined) {
    updates.isNoLimit = Boolean(couponData.isNoLimit);
    if (couponData.isNoLimit) {
      updates.minAmount = null;
      updates.maxDiscountAmount = null;
    }
  }

  await updateDoc(docRef, updates);
}

/**
 * Toggle active status
 */
export async function toggleCouponStatus(
  id: string,
  isActive: boolean
): Promise<void> {
  const docRef = doc(db, COUPONS_COLLECTION, id);
  await updateDoc(docRef, {
    isActive,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(id: string): Promise<void> {
  const docRef = doc(db, COUPONS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Validate a coupon and calculate discount
 */
export async function validateAndApplyCoupon(
  code: string,
  amount: number,
  audience: CouponTargetAudience
): Promise<CouponValidationResult> {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) {
    return { isValid: false, message: "Please provide a coupon code." };
  }

  const q = query(
    collection(db, COUPONS_COLLECTION),
    where("code", "==", cleanCode)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return { isValid: false, message: `Coupon "${cleanCode}" is invalid.` };
  }

  const couponDoc = snap.docs[0];
  const coupon = { ...(couponDoc.data() as Coupon), id: couponDoc.id };

  // 1. Active check
  if (!coupon.isActive) {
    return { isValid: false, message: "This coupon is currently inactive." };
  }

  // 2. Audience target check
  if (coupon.targetAudience !== "both" && coupon.targetAudience !== audience) {
    const roleName =
      coupon.targetAudience === "mechanic"
        ? "Mechanics & Workshops"
        : "Fleet Owners & Drivers";
    return {
      isValid: false,
      message: `This coupon is exclusively for ${roleName}.`,
    };
  }

  // 3. Expiry date check
  if (!coupon.neverExpires && coupon.expiryDate) {
    const exp = new Date(coupon.expiryDate).getTime();
    if (Date.now() > exp) {
      return { isValid: false, message: "This coupon has expired." };
    }
  }

  // 4. Start date check
  if (coupon.startDate) {
    const start = new Date(coupon.startDate).getTime();
    if (Date.now() < start) {
      return { isValid: false, message: "This coupon is not active yet." };
    }
  }

  // 5. Total usage limit check
  if (
    typeof coupon.usageLimit === "number" &&
    coupon.usageLimit > 0 &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return {
      isValid: false,
      message: "This coupon has reached its maximum redemption limit.",
    };
  }

  // 6. Minimum spend check (ONLY if isNoLimit is false)
  if (!coupon.isNoLimit && coupon.minAmount && coupon.minAmount > 0) {
    if (amount < coupon.minAmount) {
      return {
        isValid: false,
        message: `Minimum order amount of $${coupon.minAmount} required to apply this coupon.`,
      };
    }
  }

  // 7. Calculate Discount Amount
  let discount = 0;
  if (coupon.discountType === "percentage") {
    // If isNoLimit is true: 2% of $1 = $0.02, 2% of $10,000 = $200 (NO CAP!)
    discount = (amount * coupon.discountValue) / 100;

    // Apply cap ONLY if isNoLimit is FALSE and maxDiscountAmount is specified
    if (
      !coupon.isNoLimit &&
      coupon.maxDiscountAmount &&
      coupon.maxDiscountAmount > 0
    ) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  } else {
    // Flat dollar discount ($)
    discount = Math.min(amount, coupon.discountValue);
  }

  discount = Math.round(discount * 100) / 100;
  const finalAmount = Math.max(0, Math.round((amount - discount) * 100) / 100);

  return {
    isValid: true,
    message: `Coupon "${coupon.code}" applied successfully!`,
    coupon,
    discountAmount: discount,
    finalAmount,
  };
}

/**
 * Increment coupon redemption counter
 */
export async function recordCouponUsage(couponId: string): Promise<void> {
  try {
    const docRef = doc(db, COUPONS_COLLECTION, couponId);
    await updateDoc(docRef, {
      usedCount: increment(1),
      updatedAt: Timestamp.now(),
    });
  } catch (err) {
    console.warn("Could not increment coupon usage count:", err);
  }
}
