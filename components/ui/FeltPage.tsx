import type { ReactNode } from "react";
import styles from "./FeltPage.module.css";

/** Full-height page on the green felt with a warm lamp glow. Every top-level screen sits on one. */
export function FeltPage({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={[styles.page, className].filter(Boolean).join(" ")}>{children}</main>;
}
