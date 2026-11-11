import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { SubscriptionPlan } from "@/types/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plansRef = collection(db, "subscriptionPlans");
    const q = query(
      plansRef,
      where("type", "==", "treno_mechanic"),
      where("isActive", "==", true)
    );

    const snapshot = await getDocs(q);
    const plans: SubscriptionPlan[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      plans.push({
        id: docSnap.id,
        name: data.name || "Mechanic Plan",
        type: data.type || "treno_mechanic",
        description: data.description || "",
        duration: data.duration || "Monthly",
        price: typeof data.price === "number" ? data.price : parseFloat(data.price || "0"),
        discountPrice:
          data.discountPrice !== undefined && data.discountPrice !== null && data.discountPrice !== ""
            ? Number(data.discountPrice)
            : null,
        currency: data.currency || "USD",
        isActive: data.isActive ?? true,
        isPopular: data.isPopular ?? false,
        sortOrder: data.sortOrder ?? 0,
        features: Array.isArray(data.features) ? data.features : [],
        termsAndConditions: Array.isArray(data.termsAndConditions) ? data.termsAndConditions : [],
        maxBays: data.maxBays,
        serviceRadiusMiles: data.serviceRadiusMiles,
        priorityJobLeads: data.priorityJobLeads,
        directCarrierInvoicing: data.directCarrierInvoicing,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    plans.sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.price || 0) - (b.price || 0);
    });

    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    console.error("API Error fetching subscription plans:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load plans", plans: [] },
      { status: 500 }
    );
  }
}
