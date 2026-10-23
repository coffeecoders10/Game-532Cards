"use client";

import { useState } from "react";
import styles from "./JudgePanel.module.css";

interface Props {
  /** The most hands anyone can win this round. */
  handSize: number;
  players: number;
  /** A number this player can't call because it would make the calls add up to the hands. */
  forbidden: number | null;
  disabled: boolean;
  onJudge(count: number): void;
}

/** Where you call your hands: a big number to step or slide, and one button to lock it in. */
export function JudgePanel({ handSize, players, forbidden, disabled, onJudge }: Props) {
  const [count, setCount] = useState(Math.floor(handSize / players));
  const set = (next: number) => setCount(Math.min(handSize, Math.max(0, next)));
  /** Steps over the blocked number so the buttons never land on it. */
  const step = (dir: 1 | -1) => {
    const next = count + dir;
    set(next === forbidden ? next + dir : next);
  };
  const blocked = count === forbidden;
  const canDown = count > 0 && !(count === 1 && forbidden === 0);
  const canUp = count < handSize && !(count === handSize - 1 && forbidden === handSize);

  return (
    <div className={styles.panel} role="group" aria-label="Your judgement">
      <p className={styles.prompt}>How many of the {handSize} hands will you win?</p>

      <div className={styles.picker}>
        <button type="button" className={styles.step} aria-label="One fewer" disabled={disabled || !canDown} onClick={() => step(-1)}>
          −
        </button>
        <output className={styles.count} aria-live="polite">
          <b key={count}>{count}</b>
        </output>
        <button type="button" className={styles.step} aria-label="One more" disabled={disabled || !canUp} onClick={() => step(1)}>
          +
        </button>
      </div>

      <input
        className={styles.slider}
        type="range"
        min={0}
        max={handSize}
        step={1}
        value={count}
        disabled={disabled}
        aria-label="Hands you will win"
        onChange={(e) => set(Number(e.target.value))}
      />

      {blocked && (
        <p className={styles.blocked} role="status">
          You&apos;re last, so you can&apos;t call {count}: the calls can&apos;t add up to {handSize}.
        </p>
      )}

      <button type="button" className={styles.lock} disabled={disabled || blocked} onClick={() => onJudge(count)}>
        Lock in {count} {count === 1 ? "hand" : "hands"}
      </button>
    </div>
  );
}
