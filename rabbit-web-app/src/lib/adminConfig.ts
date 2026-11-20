export const ALLOWED_ADMIN_EMAILS = [
  "sachinminhas09@gmail.com",
  "regalrm7@gmail.com",
  "atul2.mylexinfotech@gmail.com",
] as const;

/**
 * Emails that have full admin bypass without requiring a subscription purchase.
 * Specifically configured for Co-Owner access.
 */
export const BYPASSED_SUBSCRIPTION_EMAILS = [
  "atul2.mylexinfotech@gmail.com",
] as const;

export const isAllowedAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ALLOWED_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
};

export const isSubscriptionBypassedEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return BYPASSED_SUBSCRIPTION_EMAILS.some((bypassedEmail) => bypassedEmail.toLowerCase() === normalized);
};
