"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserProfileButton } from "@/components/user-profile-button";

export function GlobalToolbar() {
  const pathname = usePathname();
  const isForm = pathname?.startsWith("/form");
  const isEditor = pathname === "/editor";
  const isStart = pathname === "/start";
  const isTemplates = pathname?.startsWith("/templates");
  const isPreview = pathname === "/preview";
  if (isForm || isEditor || isStart || isTemplates || isPreview) return null;
  return (
    <>
      <UserProfileButton />
      <ThemeToggle />
    </>
  );
}
