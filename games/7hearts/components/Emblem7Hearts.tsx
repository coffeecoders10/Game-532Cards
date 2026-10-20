import type { CSSProperties } from "react";
import { SuitIcon } from "@/components/cards/Suit";
import { BrassToken } from "@/components/ui/BrassToken";
import styles from "./Emblem7Hearts.module.css";

/** A 7 and a heart as brass tokens: the 7 of Hearts emblem. `animated` drops them in, for the game's landing page. */
export function Emblem7Hearts({ size = "clamp(76px, 20vw, 118px)", animated }: { size?: string; animated?: boolean }) {
  return (
    <span className={`${styles.emblem} ${animated ? styles.animated : ""}`} style={{ "--token": size } as CSSProperties}>
      <BrassToken>7</BrassToken>
      <BrassToken>
        <SuitIcon suit="H" className={styles.heart} />
      </BrassToken>
    </span>
  );
}
