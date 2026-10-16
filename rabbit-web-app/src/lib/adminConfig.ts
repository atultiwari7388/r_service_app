export const ALLOWED_ADMIN_EMAILS = [
  "sachinminhas09@gmail.com",
  "regalrm7@gmail.com",
] as const;

export const isAllowedAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ALLOWED_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
};
