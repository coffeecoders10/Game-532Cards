import type { CSSProperties, ReactNode } from "react";
import styles from "./BrassToken.module.css";

/** A round brass token with a serif glyph: the emblem for a game. Size follows `--token`. */
export function BrassToken({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <span className={[styles.token, className].filter(Boolean).join(" ")} style={style}>
      {children}
    </span>
  );
}
