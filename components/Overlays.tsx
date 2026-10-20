import { type Card, SUITS, SUIT_NAMES, type Suit, cardName } from "@/lib/game/cards";
import type { GameView, TableView } from "@/lib/game/view";
import { PlayingCard } from "./PlayingCard";
import { SuitIcon } from "./Suit";
import styles from "./Overlays.module.css";

const nameOf = (view: TableView, seat: number) => view.seats[seat].name ?? "Player";
const youOr = (view: TableView, seat: number) => (seat === view.you ? "You" : nameOf(view, seat));

// ------------------------------------------------------------------ trump

export function TrumpPicker({ onPick, disabled }: { onPick(suit: Suit): void; disabled: boolean }) {
  return (
    <div className={styles.panel} role="dialog" aria-label="Choose the trump suit">
      <h2 className={styles.title}>Pick trump</h2>
      <p className={styles.hint}>You hold the 5, so you choose the suit that beats all others this round — and you lead.</p>
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

// --------------------------------------------------------------- exchange

export function ExchangeStage({ view, game }: { view: TableView; game: GameView }) {
  const ex = game.exchange;
  if (!ex) return null;
  const taker = nameOf(view, ex.taker);
  const giver = nameOf(view, ex.giver);
  let line: string;
  if (ex.taker === view.you) line = `You drew a card from ${giver}. Choose one of yours to give back.`;
  else if (ex.giver === view.you) line = `${taker} drew a card from your hand and is choosing one to give you.`;
  else line = `${taker} is trading with ${giver}.`;

  return (
    <div className={styles.panel} role="status" key={`${ex.taker}-${ex.giver}-${ex.remaining}`}>
      <h2 className={styles.title}>Card exchange</h2>
      <div className={styles.swap}>
        <span className={styles.swapName}>{youOr(view, ex.giver)}</span>
        <div className={styles.swapCard}>
          <PlayingCard card={ex.card ?? undefined} faceDown={!ex.card} style={{ "--cw": "78px" } as React.CSSProperties} />
        </div>
        <span className={styles.swapName}>{youOr(view, ex.taker)}</span>
      </div>
      <p className={styles.hint}>{line}</p>
      {ex.remaining > 1 && <p className={styles.fine}>{ex.remaining - 1} more after this</p>}
    </div>
  );
}

/** Shown briefly to the two players involved once an exchange completes. */
export function SwapToast({ received, gave }: { received: Card; gave: Card }) {
  return (
    <div className={styles.toast} role="status">
      <PlayingCard card={gave} style={{ "--cw": "34px" } as React.CSSProperties} />
      <span aria-hidden="true">→</span>
      <PlayingCard card={received} style={{ "--cw": "34px" } as React.CSSProperties} />
      <span className={styles.toastText}>
        Gave {cardName(gave)}, got {cardName(received)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- summary

function exchangeLines(view: TableView, game: GameView) {
  const counts = new Map<string, number>();
  for (const { taker, giver } of game.summary?.owedNext ?? []) {
    const key = `${taker}:${giver}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].map(([key, n]) => {
    const [taker, giver] = key.split(":").map(Number);
    return `${youOr(view, taker)} ${taker === view.you ? "take" : "takes"} ${n} ${n === 1 ? "card" : "cards"} from ${giver === view.you ? "you" : nameOf(view, giver)}`;
  });
}

export function RoundSummary({
  view,
  game,
  onReady,
  disabled,
}: {
  view: TableView;
  game: GameView;
  onReady(): void;
  disabled: boolean;
}) {
  const summary = game.summary;
  if (!summary) return null;
  const rows = [0, 1, 2].sort((a, b) => summary.targets[b] - summary.targets[a]);
  const lines = exchangeLines(view, game);
  const iAmReady = game.ready[view.you];
  const waiting = [0, 1, 2].filter((s) => !game.ready[s]).map((s) => youOr(view, s));
  const newFive = summary.nextTargets.indexOf(5);

  return (
    <div className={`${styles.panel} ${styles.summary}`} role="dialog" aria-label={`Round ${game.round} results`}>
      <h2 className={styles.title}>Round {game.round}</h2>
      <ul className={styles.rows}>
        {rows.map((seat, i) => {
          const target = summary.targets[seat];
          const won = summary.wins[seat];
          const delta = won - target;
          return (
            <li key={seat} className={styles.row} style={{ "--i": i } as React.CSSProperties}>
              <span className={styles.badge}>{target}</span>
              <span className={styles.rowName}>{youOr(view, seat)}</span>
              <span className={styles.rowWon}>
                {won} <small>won</small>
              </span>
              <span className={styles.result} data-kind={delta < 0 ? "short" : delta > 0 ? "over" : "made"}>
                {delta < 0 ? `Short by ${-delta}` : delta > 0 ? `${delta} over` : "Exactly"}
              </span>
            </li>
          );
        })}
      </ul>

      <div className={styles.next}>
        <p>
          <strong>{newFive === view.you ? "You pick" : `${nameOf(view, newFive)} picks`}</strong> trump next round; the targets rotate.
        </p>
        {lines.length > 0 ? (
          <ul className={styles.trades}>
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.fine}>Nobody owes a trade, so there is no card exchange.</p>
        )}
      </div>

      <button type="button" className={styles.primary} disabled={disabled || iAmReady} onClick={onReady}>
        {iAmReady ? `Waiting for ${waiting.join(" and ")}` : `Deal round ${game.round + 1}`}
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ intro

/** A short banner at the start of each round announcing the new roles. */
export function RoundIntro({ view, game }: { view: TableView; game: GameView }) {
  const five = game.targets.indexOf(5);
  return (
    <div className={styles.intro} aria-hidden="true">
      <span className={styles.introRound}>Round {game.round}</span>
      <span className={styles.introRole}>
        {five === view.you ? "You hold the 5" : `${nameOf(view, five)} holds the 5`}
      </span>
    </div>
  );
}
