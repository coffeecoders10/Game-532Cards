import type { CSSProperties } from "react";
import type { GameView, TableView } from "@/lib/game/view";
import { PlayingCard } from "./PlayingCard";
import { SuitIcon } from "./Suit";
import styles from "./TrickArea.module.css";

const BURST = Array.from({ length: 10 }, (_, i) => i);

/** The cards on the table for the current hand, plus the win moment when it completes. */
export function TrickArea({ view, game }: { view: TableView; game: GameView }) {
  const relOf = (seat: number) => (seat - view.you + 3) % 3;
  const done = game.step === "trickDone" && game.trickWinner !== null;
  const winnerRel = done ? relOf(game.trickWinner as number) : null;
  const winnerName = done ? (view.seats[game.trickWinner as number].name ?? "Player") : "";

  return (
    <div className={styles.trick} data-done={done} data-winner={winnerRel ?? undefined}>
      {game.trump && (
        <SuitIcon key={game.trump} suit={game.trump} className={`${styles.mark} ${game.trump === "H" || game.trump === "D" ? styles.markRed : ""}`} />
      )}

      {game.trick.map((play, order) => {
        const rel = relOf(play.seat);
        const wins = done && game.trickWinner === play.seat;
        return (
          <div
            key={`${game.round}-${game.tricksPlayed}-${play.seat}`}
            className={styles.slot}
            data-rel={rel}
            data-win={wins}
            style={{ zIndex: order + 1 } as CSSProperties}
          >
            <PlayingCard card={play.card} className={styles.played} />
            {wins && (
              <div className={styles.burst} aria-hidden="true">
                {BURST.map((i) => (
                  <i key={i} style={{ "--a": `${i * 36}deg`, "--s": `${(i % 3) * 0.12}s` } as CSSProperties} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {done && (
        <p className={styles.award} role="status">
          {game.trickWinner === view.you ? "You take the hand" : `${winnerName} takes the hand`}
        </p>
      )}
    </div>
  );
}
