import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("⚠️ STRIPE_SECRET_KEY is not defined in environment variables.");
}

export const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2025-02-24.acacia" as any,
  appInfo: {
    name: "Treno Fleet",
    version: "1.0.0",
  },
});

export function getAppBaseUrl(req?: Request): string {
  // 1. Dynamic origin or host from incoming request
  if (req) {
    const origin = req.headers.get("origin");
    if (origin && !origin.includes("localhost")) {
      return origin.replace(/\/+$/, "");
    }

    const forwardedHost = req.headers.get("x-forwarded-host");
    const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
    if (forwardedHost && !forwardedHost.includes("localhost")) {
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
    }

    const host = req.headers.get("host");
    if (host && !host.includes("localhost")) {
      const proto =
        host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https";
      return `${proto}://${host}`.replace(/\/+$/, "");
    }

    if (origin) {
      return origin.replace(/\/+$/, "");
    }
  }

  // 2. Vercel deployment URL
  if (process.env.VERCEL_URL) {
    const proto = process.env.VERCEL_URL.startsWith("localhost")
      ? "http"
      : "https";
    return `${proto}://${process.env.VERCEL_URL}`.replace(/\/+$/, "");
  }

  // 3. Environment variables (ignoring localhost if production env exists)
  if (
    process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
  ) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }

  if (
    process.env.NEXT_PUBLIC_DOMAIN &&
    !process.env.NEXT_PUBLIC_DOMAIN.includes("localhost")
  ) {
    return process.env.NEXT_PUBLIC_DOMAIN.replace(/\/+$/, "");
  }

  // 4. Fallback configured envs
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }

  if (process.env.NEXT_PUBLIC_DOMAIN) {
    return process.env.NEXT_PUBLIC_DOMAIN.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}
