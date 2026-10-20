import type { CSSProperties } from "react";
import { BrassToken } from "@/components/ui/BrassToken";
import styles from "./Emblem532.module.css";

/** The three targets as brass tokens: the 5-3-2 emblem. `animated` drops them in, for the game's landing page. */
export function Emblem532({ size = "clamp(76px, 20vw, 118px)", animated }: { size?: string; animated?: boolean }) {
  return (
    <span className={`${styles.emblem} ${animated ? styles.animated : ""}`} style={{ "--token": size } as CSSProperties}>
      <BrassToken>5</BrassToken>
      <BrassToken>3</BrassToken>
      <BrassToken>2</BrassToken>
    </span>
  );
}
