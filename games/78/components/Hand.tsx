"use client";

import { useMemo, useRef, type CSSProperties } from "react";
import { type Card, type Suit, cardKey, sortHand } from "@/lib/cards/cards";
import { PlayingCard } from "@/components/cards/PlayingCard";
import { useFlip } from "@/lib/hooks/useFlip";
import styles from "./Hand.module.css";

interface Props {
  cards: Card[];
  trump: Suit | null;
  /** Keys of cards that can be chosen right now; others dim. Null means nothing is being chosen. */
  choosable: ReadonlySet<string> | null;
  selected: string | null;
  /** Card to glow as newly received. */
  freshKey: string | null;
  onChoose(card: Card): void;
}

/** The player's hand, fanned along the bottom of the table. */
export function Hand({ cards, trump, choosable, selected, freshKey, onChoose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const sorted = useMemo(() => sortHand(cards, trump), [cards, trump]);
  useFlip(ref);

  const n = sorted.length;
  return (
    <div className={styles.hand} ref={ref} role="group" aria-label="Your hand" data-turn={choosable !== null}>
      {sorted.map((card, i) => {
        const key = cardKey(card);
        const pickable = choosable?.has(key) ?? false;
        return (
          <PlayingCard
            key={key}
            card={card}
            trump={card.suit === trump}
            className={`${styles.card} ${selected === key ? styles.lift : ""} ${pickable ? styles.can : ""}`}
            style={{ "--d": i - (n - 1) / 2, "--k": i } as CSSProperties}
            disabled={choosable !== null && !pickable}
            selected={selected === key}
            fresh={freshKey === key}
            dataKey={key}
            onClick={pickable ? () => onChoose(card) : undefined}
          />
        );
      })}
    </div>
  );
}
