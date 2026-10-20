import { SUITS, SUIT_NAMES, type Suit } from "@/lib/cards/cards";
import { SuitIcon } from "@/components/cards/Suit";
import styles from "./TablePanel.module.css";

/** The trump chooser panel: four suit buttons and a line saying why this player is choosing. */
export function TrumpPicker({ hint, onPick, disabled }: { hint: string; onPick(suit: Suit): void; disabled: boolean }) {
  return (
    <div className={styles.panel} role="dialog" aria-label="Choose the trump suit">
      <h2 className={styles.title}>Pick trump</h2>
      <p className={styles.hint}>{hint}</p>
      <div className={styles.suits}>
        {SUITS.map((suit, i) => (
          <button
            key={suit}
            type="button"
            className={styles.suitButton}
            data-red={suit === "H" || suit === "D"}
            style={{ "--i": i } as React.CSSProperties}
            disabled={disabled}
            onClick={() => onPick(suit)}
          >
            <SuitIcon suit={suit} />
            <span>{SUIT_NAMES[suit]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
