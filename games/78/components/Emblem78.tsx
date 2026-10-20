import type { CSSProperties } from "react";
import { BrassToken } from "@/components/ui/BrassToken";
import styles from "./Emblem78.module.css";

/** The two targets as brass tokens: the 7-8 emblem. `animated` drops them in, for the game's landing page. */
export function Emblem78({ size = "clamp(76px, 20vw, 118px)", animated }: { size?: string; animated?: boolean }) {
  return (
    <span className={`${styles.emblem} ${animated ? styles.animated : ""}`} style={{ "--token": size } as CSSProperties}>
      <BrassToken>7</BrassToken>
      <BrassToken>8</BrassToken>
    </span>
  );
}
