import type { CSSProperties } from "react";
import { PlayingCard } from "@/components/cards/PlayingCard";
import { SuitIcon } from "@/components/cards/Suit";
import type { GameView, TableView } from "@/games/78/game/view";
import styles from "./TrickArea.module.css";

const BURST = Array.from({ length: 10 }, (_, i) => i);

/** The two cards in play: the lead on the left, the reply on the right, then swept to the winner. */
export function TrickArea({ view, game }: { view: TableView; game: GameView }) {
  const done = game.step === "trickDone" && game.trickWinner !== null;
  const mine = (seat: number) => (seat === view.you ? "mine" : "theirs");
  const winnerName = done ? (view.seats[game.trickWinner as number].name ?? "Player") : "";

  return (
    <div className={styles.trick} data-done={done} data-winner={done ? mine(game.trickWinner as number) : undefined}>
      {game.trump && (
        <SuitIcon
          key={game.trump}
          suit={game.trump}
          className={`${styles.mark} ${game.trump === "H" || game.trump === "D" ? styles.markRed : ""}`}
        />
      )}

      {game.trick.map((play, order) => {
        const wins = done && game.trickWinner === play.seat;
        return (
          <div
            key={`${game.deal}-${game.tricksPlayed}-${play.seat}`}
            className={styles.slot}
            data-order={order}
            data-from={mine(play.seat)}
            data-win={wins}
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
