import type { ReactNode } from "react";
import styles from "./Divider.module.css";

/** A hairline with a short label in the middle: "or join friends". */
export function Divider({ children }: { children: ReactNode }) {
  return (
    <div className={styles.divider} aria-hidden="true">
      <span>{children}</span>
    </div>
  );
}
