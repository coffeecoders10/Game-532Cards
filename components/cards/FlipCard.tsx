import type { CSSProperties } from "react";
import type { Card } from "@/lib/cards/cards";
import { PlayingCard } from "./PlayingCard";
import styles from "./FlipCard.module.css";

/** A decorative card, face down until hovered, then it turns face up. Size it with `--cw`, place it with `className`. */
export function FlipCard({ card, className = "", style }: { card: Card; className?: string; style?: CSSProperties }) {
  return (
    <span className={`${styles.wrap} ${className}`} style={style}>
      <span className={styles.flip}>
        <PlayingCard faceDown />
        <PlayingCard card={card} className={styles.front} />
      </span>
    </span>
  );
}
