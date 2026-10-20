import { type CSSProperties, type RefObject, useLayoutEffect, useRef } from "react";
import { PlayingCard } from "@/components/cards/PlayingCard";
import { SuitIcon } from "@/components/cards/Suit";
import { cardKey } from "@/lib/cards/cards";
import type { TrickPlay } from "@/games/78/game/engine";
import type { GameView, TableView } from "@/games/78/game/view";
import styles from "./TrickArea.module.css";

const BURST = Array.from({ length: 10 }, (_, i) => i);

export interface PlayOrigin {
  key: string;
  rect: DOMRect;
}

const centre = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

/** Where a card was lying when it was played: the exact card I clicked, else its column or the hand it came from. */
function originOf(play: TrickPlay, you: number, mine: RefObject<PlayOrigin | null>): DOMRect | null {
  if (play.seat === you && mine.current?.key === cardKey(play.card)) {
    const rect = mine.current.rect;
    mine.current = null;
    return rect;
  }
  const side = play.seat === you ? "mine" : "theirs";
  const selector = play.slot !== null ? `[data-origin="${side}-${play.slot}"]` : play.seat === you ? '[data-origin="mine-hand"]' : '[data-origin="fan"]';
  return document.querySelector(selector)?.getBoundingClientRect() ?? null;
}

/** The two cards in play: the lead on the left, the reply on the right, then swept to the winner. */
export function TrickArea({ view, game, myOrigin }: { view: TableView; game: GameView; myOrigin: RefObject<PlayOrigin | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<string> | null>(null);

  // Each newly played card slides in from where it was, for both players. Cards already on the table
  // when this mounts (a reload mid-hand) just appear.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const first = seen.current === null;
    const known = (seen.current ??= new Set());
    for (const play of game.trick) {
      const id = `${game.deal}-${game.tricksPlayed}-${play.seat}`;
      if (known.has(id)) continue;
      known.add(id);
      const el = root.querySelector<HTMLElement>(`[data-play="${id}"]`);
      const from = first || !el ? null : originOf(play, view.you, myOrigin);
      if (!el || !from) continue;
      const to = el.getBoundingClientRect();
      const a = centre(from);
      const b = centre(to);
      el.animate(
        [
          { transform: `translate(${a.x - b.x}px, ${a.y - b.y}px) scale(${from.width / to.width}) rotate(-12deg)`, opacity: 0.9 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" },
      );
    }
  }, [game.trick, game.deal, game.tricksPlayed, view.you, myOrigin]);

  const done = game.step === "trickDone" && game.trickWinner !== null;
  const mine = (seat: number) => (seat === view.you ? "mine" : "theirs");
  const winnerName = done ? (view.seats[game.trickWinner as number].name ?? "Player") : "";

  return (
    <div className={styles.trick} ref={ref} data-done={done} data-winner={done ? mine(game.trickWinner as number) : undefined}>
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
            data-play={`${game.deal}-${game.tricksPlayed}-${play.seat}`}
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
