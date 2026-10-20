"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { type Card, type Suit, cardKey, sortHand } from "@/lib/cards/cards";
import { PlayingCard } from "@/components/cards/PlayingCard";
import { useFlip } from "@/lib/hooks/useFlip";
import { useMediaQuery } from "@/lib/hooks/useClientValue";
import styles from "./Hand.module.css";

interface Props {
  cards: Card[];
  trump: Suit | null;
  /** Cards that may be chosen right now; others are dimmed. Null means "nothing to choose". */
  choosable: Card[] | null;
  /** Card to glow as newly received. */
  freshKey: string | null;
  onChoose(card: Card): void;
}

export function Hand({ cards, trump, choosable, freshKey, onChoose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const touch = useMediaQuery("(pointer: coarse)");
  const sorted = useMemo(() => sortHand(cards, trump), [cards, trump]);
  const choosableKeys = useMemo(() => new Set(choosable?.map(cardKey)), [choosable]);
  useFlip(ref);

  // A selection only makes sense while that card is still choosable.
  const activeSelection = selected && choosableKeys.has(selected) ? selected : null;

  const choose = (card: Card) => {
    const key = cardKey(card);
    if (!choosableKeys.has(key)) return;
    if (touch && activeSelection !== key) {
      setSelected(key);
      return;
    }
    setSelected(null);
    onChoose(card);
  };

  // Cards arriving in the same batch are dealt one after another.
  const n = sorted.length;
  return (
    <div className={styles.hand} ref={ref} role="group" aria-label="Your hand" data-turn={choosable !== null}>
      {sorted.map((card, i) => {
        const key = cardKey(card);
        const style = {
          "--d": i - (n - 1) / 2,
          "--k": i,
        } as CSSProperties;
        return (
          <PlayingCard
            key={key}
            card={card}
            trump={card.suit === trump}
            className={`${styles.card} ${activeSelection === key ? styles.lift : ""}`}
            style={style}
            disabled={choosable !== null && !choosableKeys.has(key)}
            selected={activeSelection === key}
            fresh={freshKey === key}
            dataKey={key}
            onClick={() => choose(card)}
          />
        );
      })}
    </div>
  );
}
