import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./BackLink.module.css";

/** Small quiet "‹ label" link for stepping back up a level. */
export function BackLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={[styles.link, className].filter(Boolean).join(" ")}>
      <span aria-hidden="true">‹</span> {children}
    </Link>
  );
}
