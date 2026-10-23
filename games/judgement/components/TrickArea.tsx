import type { CSSProperties } from "react";
import { PlayingCard } from "@/components/cards/PlayingCard";
import { SuitIcon } from "@/components/cards/Suit";
import { isRed } from "@/lib/cards/cards";
import type { GameView, TableView } from "@/games/judgement/game/view";
import { direction } from "./ring";
import styles from "./TrickArea.module.css";

const BURST = Array.from({ length: 10 }, (_, i) => i);

/** The cards on the table for the current hand, each on the side of the player who played it. */
export function TrickArea({ view, game }: { view: TableView; game: GameView }) {
  const n = game.players;
  const relOf = (seat: number) => (seat - view.you + n) % n;
  const done = game.step === "trickDone" && game.trickWinner !== null;
  const winner = done ? direction(relOf(game.trickWinner as number), n) : null;
  const winnerName = done ? (view.seats[game.trickWinner as number]?.name ?? "Player") : "";

  return (
    <div
      className={styles.trick}
      data-done={done}
      style={winner ? ({ "--wx": winner.x, "--wy": winner.y } as CSSProperties) : undefined}
    >
      <SuitIcon
        key={`${game.round}${game.trump}`}
        suit={game.trump}
        className={`${styles.mark} ${isRed(game.trump) ? styles.markRed : ""}`}
      />

      {game.trick.map((play, order) => {
        const rel = relOf(play.seat);
        const dir = direction(rel, n);
        const wins = done && game.trickWinner === play.seat;
        return (
          <div
            key={`${game.round}-${game.tricksPlayed}-${play.seat}`}
            className={styles.slot}
            data-win={wins}
            style={
              {
                "--x": dir.x,
                "--y": dir.y,
                "--tilt": `${((rel * 37 + order * 11) % 17) - 8}deg`,
                zIndex: order + 1,
              } as CSSProperties
            }
          >
            <PlayingCard card={play.card} trump={play.card.suit === game.trump} className={styles.played} />
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
