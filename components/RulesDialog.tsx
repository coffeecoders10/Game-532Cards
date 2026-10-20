import type { RefObject } from "react";
import styles from "./RulesDialog.module.css";

export function RulesDialog({ dialogRef }: { dialogRef: RefObject<HTMLDialogElement | null> }) {
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="rules-title"
      onClick={(e) => {
        // Clicking the backdrop (the dialog element itself) closes it.
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className={styles.body}>
        <h2 id="rules-title">How 5-3-2 plays</h2>
        <ol>
          <li>
            <strong>Three players, ten hands.</strong> One player needs to win 5 hands, one 3 and one 2. Win at least your
            number.
          </li>
          <li>
            <strong>The deck is 30 cards:</strong> 8 through Ace in every suit, plus the 7 of spades and 7 of hearts.
            Ace is high, 7 is low.
          </li>
          <li>
            <strong>Trump.</strong> Everyone gets 5 cards, then whoever holds the 5 picks the trump suit and everyone gets
            5 more.
          </li>
          <li>
            <strong>Playing a hand.</strong> The 5 leads. Follow the suit led if you can, otherwise play anything. Highest
            trump wins; with no trump, the highest card of the led suit wins. The winner leads the next hand.
          </li>
          <li>
            <strong>Trades.</strong> Win more than your number and you can trade next round: you draw a random card from
            someone who fell short, then give back any card you like. One trade for each hand of difference.
          </li>
          <li>
            <strong>Rotation.</strong> After every round the 5 becomes the 2, the 3 becomes the 5, and the 2 becomes the
            3. There is no last round.
          </li>
        </ol>
        <form method="dialog">
          <button type="submit" className={styles.close}>
            Back to the table
          </button>
        </form>
      </div>
    </dialog>
  );
}
