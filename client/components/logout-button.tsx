"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface LogoutButtonProps {
  className?: string;
}

const defaultClassName =
  "rounded-lg border border-border/70 bg-transparent px-3 py-1.5 font-manrope text-xs font-medium text-foreground transition-colors hover:bg-muted";

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className ?? defaultClassName}
    >
      Log out
    </button>
  );
}
