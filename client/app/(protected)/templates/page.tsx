"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TemplatesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/templates/select");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
    </div>
  );
}
