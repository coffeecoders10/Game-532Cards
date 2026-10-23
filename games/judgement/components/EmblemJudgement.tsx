import type { CSSProperties } from "react";
import { SuitIcon } from "@/components/cards/Suit";
import { BrassToken } from "@/components/ui/BrassToken";
import styles from "./EmblemJudgement.module.css";

/** A J and a spade as brass tokens: the Judgement emblem. `animated` drops them in, for the game's landing page. */
export function EmblemJudgement({ size = "clamp(76px, 20vw, 118px)", animated }: { size?: string; animated?: boolean }) {
  return (
    <span className={`${styles.emblem} ${animated ? styles.animated : ""}`} style={{ "--token": size } as CSSProperties}>
      <BrassToken>J</BrassToken>
      <BrassToken>
        <SuitIcon suit="S" className={styles.spade} />
      </BrassToken>
    </span>
  );
}
