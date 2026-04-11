import Link from "next/link";
import type { ReactNode } from "react";

type FormNavLinkProps = {
  href: string;
  enabled: boolean;
  className: string;
  title?: string;
  children: ReactNode;
};

export function FormNavLink({
  href,
  enabled,
  className,
  title = "Fill all required fields in this section before continuing.",
  children,
}: FormNavLinkProps) {
  if (!enabled) {
    return (
      <span
        role="link"
        aria-disabled="true"
        title={title}
        className={`${className} cursor-not-allowed opacity-45`}
      >
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
