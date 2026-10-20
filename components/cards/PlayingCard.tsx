import type { CSSProperties, ReactNode } from "react";
import { type Card, RANK_LABELS, cardName, isRed } from "@/lib/cards/cards";
import { SuitIcon } from "@/components/cards/Suit";
import styles from "./PlayingCard.module.css";

/** Pip positions (x%, y%) for the number cards. */
const PIPS: Record<number, [number, number][]> = {
  2: [[50, 20], [50, 80]],
  3: [[50, 20], [50, 50], [50, 80]],
  4: [[33, 20], [67, 20], [33, 80], [67, 80]],
  5: [[33, 20], [67, 20], [50, 50], [33, 80], [67, 80]],
  6: [[33, 20], [67, 20], [33, 50], [67, 50], [33, 80], [67, 80]],
  7: [[33, 20], [67, 20], [33, 50], [67, 50], [33, 80], [67, 80], [50, 35]],
  8: [[33, 20], [67, 20], [33, 50], [67, 50], [33, 80], [67, 80], [50, 35], [50, 65]],
  9: [[33, 20], [67, 20], [33, 40], [67, 40], [33, 60], [67, 60], [33, 80], [67, 80], [50, 50]],
  10: [[33, 20], [67, 20], [33, 40], [67, 40], [33, 60], [67, 60], [33, 80], [67, 80], [50, 30], [50, 70]],
};

interface Props {
  card?: Card;
  faceDown?: boolean;
  /** Dimmed because it can't be played right now. */
  disabled?: boolean;
  selected?: boolean;
  /** Freshly received card, highlighted for a moment. */
  fresh?: boolean;
  trump?: boolean;
  dataKey?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  children?: ReactNode;
}

function Face({ card }: { card: Card }) {
  const label = RANK_LABELS[card.rank];
  const pips = PIPS[card.rank];
  return (
    <>
      <span className={styles.corner}>
        <b>{label}</b>
        <SuitIcon suit={card.suit} />
      </span>
      <span className={`${styles.corner} ${styles.cornerFlip}`}>
        <b>{label}</b>
        <SuitIcon suit={card.suit} />
      </span>
      {pips ? (
        pips.map(([x, y], i) => (
          <span key={i} className={styles.pipSlot} style={{ left: `${x}%`, top: `${y}%` }}>
            <SuitIcon suit={card.suit} className={`${styles.pip} ${y > 50 ? styles.pipFlip : ""}`} />
          </span>
        ))
      ) : card.rank === 14 ? (
        <SuitIcon suit={card.suit} className={styles.ace} />
      ) : (
        <span className={styles.royal}>
          <SuitIcon suit={card.suit} className={styles.royalSuit} />
          <b>{label}</b>
          <SuitIcon suit={card.suit} className={`${styles.royalSuit} ${styles.pipFlip}`} />
        </span>
      )}
    </>
  );
}

/** A single playing card. Renders a button when it has a click handler. */
export function PlayingCard({
  card,
  faceDown,
  disabled,
  selected,
  fresh,
  trump,
  dataKey,
  className = "",
  style,
  onClick,
  children,
}: Props) {
  const up = !faceDown && card;
  const classes = [
    styles.card,
    up ? styles.face : styles.back,
    up && isRed(card.suit) ? styles.red : "",
    disabled ? styles.disabled : "",
    selected ? styles.selected : "",
    fresh ? styles.fresh : "",
    trump ? styles.trump : "",
    className,
  ].join(" ");
  const label = up ? cardName(card) : "Face-down card";
  const content = (
    <>
      {up ? <Face card={card} /> : <span className={styles.crest} aria-hidden="true" />}
      {children}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} style={style} data-key={dataKey} onClick={onClick} aria-label={label} aria-disabled={disabled}>
        {content}
      </button>
    );
  }
  return (
    <div className={classes} style={style} data-key={dataKey} role="img" aria-label={label}>
      {content}
    </div>
  );
}
