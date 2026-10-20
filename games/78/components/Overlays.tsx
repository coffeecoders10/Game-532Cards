import { type CSSProperties, useEffect, useState } from "react";
import { type Card, cardName } from "@/lib/cards/cards";
import { PlayingCard } from "@/components/cards/PlayingCard";
import { eightSeat } from "@/games/78/game/engine";
import type { GameView, TableView } from "@/games/78/game/view";
import panel from "@/components/table/TablePanel.module.css";
import styles from "./Overlays.module.css";

const nameOf = (view: TableView, seat: number) => view.seats[seat].name ?? "Player";
const youOr = (view: TableView, seat: number) => (seat === view.you ? "You" : nameOf(view, seat));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ------------------------------------------------------------------ intro

/** A short banner at the start of each deal saying who is who. */
export function DealIntro({ view, game }: { view: TableView; game: GameView }) {
  const eight = eightSeat(game);
  return (
    <div className={styles.intro} aria-hidden="true">
      <span className={styles.introDeal}>Deal {game.deal}</span>
      <span className={styles.introRole}>
        {eight === view.you ? "You are the 8" : `${nameOf(view, eight)} is the 8`}
      </span>
    </div>
  );
}

// ------------------------------------------------------------------- swap

interface SwapProps {
  view: TableView;
  game: GameView;
  /** Whether the taker has a card lined up to take or give. */
  hasSelection: boolean;
  disabled: boolean;
  onTakeSelected(): void;
  onTakeBlind(): void;
  onGive(): void;
}

/**
 * The swap bar between the two sets of cards. The player owed a swap picks from the other
 * player's face-up cards (or draws blind from their hand), then a card of their own to give back.
 */
export function SwapPanel({ view, game, hasSelection, disabled, onTakeSelected, onTakeBlind, onGive }: SwapProps) {
  const swap = game.swap;
  if (!swap) return null;
  const taker = nameOf(view, swap.taker);
  const giver = nameOf(view, swap.giver);
  const iTake = swap.taker === view.you;
  const pending = swap.pending;
  const step = swap.total - swap.remaining + 1;

  let line: string;
  if (iTake) {
    line = pending
      ? `Now choose one of your cards to give ${giver}.`
      : `Take one of ${giver}'s face-up cards, or draw blind from their hand.`;
  } else if (!pending) {
    line = `${taker} is choosing a card to take from you…`;
  } else if (pending.source.zone === "table") {
    line = `${taker} is taking the marked card and choosing what to give back.`;
  } else {
    line = `${taker} drew a card from your hand and is choosing what to give back.`;
  }

  return (
    <div className={styles.swap} role="status" key={`${swap.remaining}-${pending ? "give" : "take"}`}>
      <div className={styles.swapHead}>
        <span className={styles.swapTitle}>Card swap</span>
        <span className={styles.swapCount}>
          {step} of {swap.total}
        </span>
      </div>
      <div className={styles.swapBody}>
        {pending && (
          <div className={styles.swapCard} aria-label={pending.card ? cardName(pending.card) : "A card from the hand"}>
            <PlayingCard
              card={pending.card ?? undefined}
              faceDown={!pending.card}
              back="rosette"
              style={{ "--cw": "42px" } as CSSProperties}
            />
          </div>
        )}
        <p className={styles.swapLine}>{line}</p>
      </div>
      {iTake && !pending && (
        <div className={styles.swapActions}>
          <button type="button" className={styles.primary} disabled={disabled || !hasSelection} onClick={onTakeSelected}>
            Take selected
          </button>
          <button type="button" className={styles.secondary} disabled={disabled} onClick={onTakeBlind}>
            Draw blind
          </button>
        </div>
      )}
      {iTake && pending && (
        <div className={styles.swapActions}>
          <button type="button" className={styles.primary} disabled={disabled || !hasSelection} onClick={onGive}>
            Give selected
          </button>
        </div>
      )}
    </div>
  );
}

/** Shown briefly to the two players involved once a swap completes. */
export function SwapToast({ received, gave }: { received: Card; gave: Card }) {
  return (
    <div className={styles.toast} role="status">
      <PlayingCard card={gave} style={{ "--cw": "34px" } as CSSProperties} />
      <span aria-hidden="true">→</span>
      <PlayingCard card={received} style={{ "--cw": "34px" } as CSSProperties} />
      <span className={styles.toastText}>
        Gave {cardName(gave)}, got {cardName(received)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- summary

interface SummaryProps {
  view: TableView;
  game: GameView;
  disabled: boolean;
  onReady(): void;
  onLeave(): void;
}

/** End-of-deal sheet: who won what, who owes whom, and what happens next. */
export function DealSummary({ view, game, disabled, onReady, onLeave }: SummaryProps) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  useEffect(() => {
    if (!confirmLeave) return;
    const timer = setTimeout(() => setConfirmLeave(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmLeave]);

  const summary = game.summary;
  if (!summary) return null;
  const rows = [0, 1].sort((a, b) => summary.targets[b] - summary.targets[a]);
  const debt = summary.debt;
  const iAmReady = game.ready[view.you];
  const other = 1 - view.you;

  let owes: string;
  if (!debt) owes = "Nobody owes anything, so there are no swaps next deal.";
  else if (debt.giver === view.you) {
    owes = `You took ${plural(debt.count, "hand", "hands")} too many. ${nameOf(view, debt.taker)} gets ${plural(debt.count, "swap", "swaps")} with you next deal.`;
  } else {
    owes = `${nameOf(view, debt.giver)} took ${plural(debt.count, "hand", "hands")} too many. You get ${plural(debt.count, "swap", "swaps")} with them next deal.`;
  }

  return (
    <div className={`${panel.panel} ${styles.summary}`} role="dialog" aria-label={`Deal ${game.deal} results`}>
      <h2 className={panel.title}>Deal {game.deal}</h2>
      <ul className={styles.rows}>
        {rows.map((seat, i) => {
          const target = summary.targets[seat];
          const won = summary.wins[seat];
          const delta = won - target;
          return (
            <li key={seat} className={styles.row} style={{ "--i": i } as CSSProperties}>
              <span className={styles.badge}>{target}</span>
              <span className={styles.rowName}>{youOr(view, seat)}</span>
              <span className={styles.rowWon}>
                {won} <small>of 15</small>
              </span>
              <span className={styles.result} data-kind={delta < 0 ? "short" : delta > 0 ? "over" : "made"}>
                {delta < 0 ? `Short by ${-delta}` : delta > 0 ? `${delta} over` : "Exactly"}
              </span>
            </li>
          );
        })}
      </ul>

      <p className={styles.owes} data-debt={debt !== null}>
        {owes}
      </p>
      <p className={panel.fine}>
        Targets met so far: you {game.made[view.you]} of {game.dealsPlayed}, {nameOf(view, other)} {game.made[other]}.
      </p>

      <button type="button" className={`${panel.primary} ${styles.next}`} disabled={disabled || iAmReady} onClick={onReady}>
        {iAmReady ? `Waiting for ${nameOf(view, other)}` : `Deal ${game.deal + 1}`}
      </button>
      <button type="button" className={styles.quit} data-danger={confirmLeave} onClick={() => (confirmLeave ? onLeave() : setConfirmLeave(true))}>
        {confirmLeave ? "Leave table?" : "Leave table"}
      </button>
    </div>
  );
}
