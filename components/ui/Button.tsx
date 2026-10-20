import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary";

const cls = (variant: Variant, className?: string) =>
  [styles.button, variant === "primary" ? styles.primary : styles.secondary, className].filter(Boolean).join(" ");

/** The chunky brass (primary) or paper (secondary) button used for every call to action. */
export function Button({
  variant = "primary",
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={cls(variant, className)} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  href,
  children,
}: {
  variant?: Variant;
  className?: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cls(variant, className)}>
      {children}
    </Link>
  );
}
