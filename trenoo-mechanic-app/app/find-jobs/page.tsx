"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FindJobsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const dest = query ? `/jobs?${query}` : "/jobs";
    router.replace(dest);
  }, [router, searchParams]);

  return null;
}

export default function FindJobsPage() {
  return (
    <Suspense fallback={null}>
      <FindJobsRedirect />
    </Suspense>
  );
}
