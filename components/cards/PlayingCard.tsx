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
 * Card backs are flat vector posters on a 100x140 grid, in four roast tones and nothing else: no
 * gradients, no texture. Both are mirrored left-right and top-bottom, so they read the same whichever
 * way up the card lies. `Sunrise` is the standard back; `Diamond` is the alternate.
 */
const MIRRORS = ["", "translate(100 0) scale(-1 1)", "translate(0 140) scale(1 -1)", "translate(100 140) scale(-1 -1)"];

/** A flat bean: an oval and its crease, centred on (x, y). `tone` is the body, `cut` the crease. */
function PosterBean({ x, y, turn, size = 1, tone, cut }: { x: number; y: number; turn: number; size?: number; tone: string; cut: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${size})`}>
      <ellipse rx="3.4" ry="5" className={tone} />
      <path d="M0 -4.2C-2.2 -1.6 2.2 1.2 0 4.2" className={cut} />
    </g>
  );
}

function Sunrise() {
  return (
    <svg className={styles.poster} viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="140" className={styles.pBase} />
      {MIRRORS.map((transform) => (
        <g key={transform} transform={transform}>
          <circle r="34" className={styles.pDeep} />
          <circle r="23" className={styles.pMid} />
          <circle r="12" className={styles.pCaramel} />
          <circle r="4" className={styles.pBase} />
        </g>
      ))}
      <circle cx="50" cy="70" r="31" className={styles.pCrema} />
      {[5, 11, 18].map((y, i) =>
        [-1, 1].map((side) => (
          <rect key={`${y}${side}`} x="16" width="68" height={2 + i * 1.5} y={side > 0 ? 70 + y : 70 - y - (2 + i * 1.5)} className={styles.pBase} />
        )),
      )}
      <circle cx="50" cy="70" r="36" className={styles.pHair} />
      {[[50, 24, 0], [50, 116, 0], [10, 70, 90], [90, 70, 90]].map(([x, y, turn]) => (
        <PosterBean key={`${x}${y}`} x={x} y={y} turn={turn} tone={styles.pCrema} cut={styles.pCutDark} />
      ))}
      <PosterBean x={50} y={70} turn={90} size={1.55} tone={styles.pBase} cut={styles.pCutLight} />
    </svg>
  );
}

function Diamond() {
  return (
    <svg className={styles.poster} viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="140" className={styles.pBase} />
      {MIRRORS.map((transform) => (
        <g key={transform} transform={transform}>
          <path d="M0 0H44L0 44Z" className={styles.pDeep} />
          <path d="M0 0H30L0 30Z" className={styles.pMid} />
          <path d="M0 0H16L0 16Z" className={styles.pCaramel} />
        </g>
      ))}
      <path d="M50 22 L82 70 L50 118 L18 70Z" className={styles.pCaramel} />
      <path d="M50 32 L74 70 L50 108 L26 70Z" className={styles.pBase} />
      <path d="M50 42 L66 70 L50 98 L34 70Z" className={styles.pMid} />
      <circle cx="50" cy="70" r="12" className={styles.pCrema} />
      <PosterBean x={50} y={70} turn={28} size={1.45} tone={styles.pBase} cut={styles.pCutLight} />
      {[[50, 12], [50, 128], [12, 70], [88, 70]].map(([x, y]) => (
        <PosterBean key={`${x}${y}`} x={x} y={y} turn={x === 50 ? 0 : 90} size={0.75} tone={styles.pCrema} cut={styles.pCutDark} />
      ))}
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
          {back === "rosette" ? <Diamond /> : <Sunrise />}
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
