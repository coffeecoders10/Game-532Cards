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
  /** Back design for face-down cards: the plain lattice, or the ornamental rosette. */
  back?: "lattice" | "rosette";
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

/**
 * The rosette back: a brass medallion with an eight-point star, framed and cornered, drawn on a
 * 100x140 grid so it is symmetrical top to bottom and left to right at any card size.
 */
function Rosette() {
  return (
    <svg className={styles.ornament} viewBox="0 0 100 140" aria-hidden="true">
      <rect x="9" y="9" width="82" height="122" rx="4" className={styles.line} />
      <rect x="12.5" y="12.5" width="75" height="115" rx="2.5" className={styles.hair} />
      {[
        "translate(12.5 12.5)",
        "translate(87.5 12.5) scale(-1 1)",
        "translate(12.5 127.5) scale(1 -1)",
        "translate(87.5 127.5) scale(-1 -1)",
      ].map((transform) => (
        <g key={transform} transform={transform}>
          <path d="M0 15 A15 15 0 0 0 15 0" className={styles.line} />
          <path d="M0 9.5 A9.5 9.5 0 0 0 9.5 0" className={styles.hair} />
          <circle cx="5.2" cy="5.2" r="1.7" className={styles.solid} />
        </g>
      ))}
      {[0, 180].map((turn) => (
        <g key={turn} transform={`rotate(${turn} 50 70)`}>
          <path d="M50 43 V35.5" className={styles.hair} />
          <path d="M50 22.5 L54.4 29 L50 35.5 L45.6 29 Z" className={styles.line} />
          <circle cx="50" cy="29" r="1.3" className={styles.solid} />
          <circle cx="50" cy="18" r="1.4" className={styles.solid} />
          <path d="M23 70 H18.5" className={styles.hair} />
          <path d="M18.5 70 L16.2 67 M18.5 70 L16.2 73" className={styles.hair} />
        </g>
      ))}
      <g transform="translate(50 70)">
        <circle r="27" className={styles.line} />
        <circle r="24.6" className={styles.hair} />
        <rect x="-15" y="-15" width="30" height="30" className={`${styles.line} ${styles.tint}`} />
        <rect x="-15" y="-15" width="30" height="30" className={`${styles.line} ${styles.tint}`} transform="rotate(45)" />
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx="0" cy="-19.5" rx="2.6" ry="5.2" className={styles.hair} transform={`rotate(${i * 45 + 22.5})`} />
        ))}
        <circle r="8.4" className={styles.solid} />
        <circle r="5.6" className={styles.ground} />
        <circle r="2.3" className={styles.solid} />
      </g>
    </svg>
  );
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
  back = "lattice",
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
    !up && back === "rosette" ? styles.rosette : "",
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
      {up ? (
        <Face card={card} />
      ) : (
        <span className={styles.crest} aria-hidden="true">
          {back === "rosette" && <Rosette />}
        </span>
      )}
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
