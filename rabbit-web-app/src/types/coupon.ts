export type CouponDiscountType = "percentage" | "flat";

export type CouponTargetAudience = "mechanic" | "owner_driver" | "both";

export interface Coupon {
  id: string;
  code: string; // Uppercase, e.g. "TRENO20", "FLAT50"
  description: string;
  discountType: CouponDiscountType; // "percentage" (%) or "flat" ($)
  discountValue: number; // e.g. 2 for 2% or 50 for $50
  targetAudience: CouponTargetAudience; // "mechanic" | "owner_driver" | "both"

  // Limit configuration
  isNoLimit: boolean; // When true: applies to any amount (from $1 to $10,000+) without min or max caps
  minAmount?: number | null; // Minimum spend required (e.g. $50). Ignored if isNoLimit is true
  maxDiscountAmount?: number | null; // Cap on discount in $ (e.g. max $100 off). Ignored if isNoLimit is true

  // Validity
  startDate?: string | null;
  expiryDate?: string | null;
  neverExpires: boolean;

  // Usage constraints
  usageLimit?: number | null; // Total platform-wide redemptions allowed (null = unlimited)
  perUserLimit?: number | null; // Max redemptions per user (default 1)
  usedCount: number; // Running count of redemptions

  // Status
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface CouponValidationResult {
  isValid: boolean;
  message?: string;
  coupon?: Coupon;
  discountAmount?: number;
  finalAmount?: number;
}
