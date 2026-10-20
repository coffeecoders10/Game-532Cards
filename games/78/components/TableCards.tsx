import type { CSSProperties } from "react";
import { type Suit, cardKey } from "@/lib/cards/cards";
import { PlayingCard } from "@/components/cards/PlayingCard";
import type { StackView } from "@/games/78/game/view";
import styles from "./TableCards.module.css";

interface Props {
  stacks: StackView[];
  /** Mine sit nearest the player (down card peeks above); theirs mirror that. */
  side: "mine" | "theirs";
  trump: Suit | null;
  /** Columns that can be picked right now; others dim. Null means nothing is being picked. */
  choosable: ReadonlySet<number> | null;
  selected: number | null;
  /** A column an opponent's swap is aimed at. */
  marked: number | null;
  /** A column whose card just arrived through a swap. */
  fresh: number | null;
  /** The cards were only just dealt: fly them in from the deck. */
  dealing: boolean;
  label: string;
  onChoose(slot: number): void;
}

/**
 * The five columns in front of a player: a face-up card lying over a face-down one. Playing the
 * face-up card turns the one beneath over (it is keyed by the card, so it flips in on arrival).
 */
export function TableCards({ stacks, side, trump, choosable, selected, marked, fresh, dealing, label, onChoose }: Props) {
  return (
    <div className={styles.row} data-side={side} role="group" aria-label={label}>
      {stacks.map((stack, slot) => {
        const pickable = choosable?.has(slot) ?? false;
        const up = stack.up;
        const style = {
          "--k": slot,
          "--from": dealing ? "-60dvh" : side === "mine" ? "calc(var(--peek) * -1)" : "var(--peek)",
          "--delay": dealing ? `${slot * 70 + 450}ms` : "0ms",
        } as CSSProperties;
        return (
          <div key={slot} className={styles.column} style={style} data-empty={!up && !stack.hasDown} data-marked={marked === slot} data-origin={`${side}-${slot}`}>
            {stack.hasDown && <PlayingCard faceDown back="rosette" className={styles.down} />}
            {up && (
              <PlayingCard
                key={cardKey(up)}
                card={up}
                trump={up.suit === trump}
                className={`${styles.up} ${pickable ? styles.can : ""} ${selected === slot ? styles.chosen : ""}`}
                disabled={choosable !== null && !pickable}
                selected={selected === slot}
                fresh={fresh === slot}
                // Always a button, so a card keeps its element (and doesn't replay its entrance) as turns change.
                onClick={() => pickable && onChoose(slot)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
