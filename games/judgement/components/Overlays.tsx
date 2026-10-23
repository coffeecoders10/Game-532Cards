"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { SUIT_NAMES, type Suit, isRed } from "@/lib/cards/cards";
import { SuitIcon } from "@/components/cards/Suit";
import { leaders } from "@/games/judgement/game/engine";
import type { GameView, TableView } from "@/games/judgement/game/view";
import panel from "@/components/table/TablePanel.module.css";
import styles from "./Overlays.module.css";

const nameOf = (view: TableView, seat: number) => view.seats[seat]?.name ?? "Player";
const youOr = (view: TableView, seat: number) => (seat === view.you ? "You" : nameOf(view, seat));
const seatsByScore = (scores: readonly number[]) =>
  scores.map((_, seat) => seat).sort((a, b) => scores[b] - scores[a] || a - b);

/** The trump suit stamped over the table when a round is dealt, then gone. */
export function TrumpReveal({ suit, round }: { suit: Suit; round: number }) {
  return (
    <div className={styles.reveal} key={round} role="status" data-red={isRed(suit)}>
      <SuitIcon suit={suit} className={styles.revealSuit} />
      <p className={styles.revealText}>Trump is {SUIT_NAMES[suit]}</p>
    </div>
  );
}

/** The trump suit, large and constant, for the corner of the table. */
export function TrumpBadge({ suit }: { suit: Suit }) {
  return (
    <div className={styles.badge} data-red={isRed(suit)} key={suit} aria-label={`Trump: ${SUIT_NAMES[suit]}`}>
      <SuitIcon suit={suit} />
      <span>
        <small>Trump</small>
        {SUIT_NAMES[suit]}
      </span>
    </div>
  );
}

interface RoundProps {
  view: TableView;
  game: GameView;
  isHost: boolean;
  disabled: boolean;
  onReady(): void;
  onEnd(): void;
}

function useConfirm() {
  const [asked, setAsked] = useState(false);
  useEffect(() => {
    if (!asked) return;
    const timer = setTimeout(() => setAsked(false), 3000);
    return () => clearTimeout(timer);
  }, [asked]);
  return [asked, setAsked] as const;
}

/** End-of-round sheet: what everyone called, what they won, who scored, and the running totals. */
export function RoundSummary({ view, game, isHost, disabled, onReady, onEnd }: RoundProps) {
  const [confirmEnd, setConfirmEnd] = useConfirm();
  const record = game.history[game.history.length - 1];
  if (!record) return null;

  const rows = seatsByScore(game.scores);
  const top = leaders(game.scores);
  const waiting = game.ready.filter(Boolean).length;
  const iAmReady = game.ready[view.you];

  return (
    <div className={`${panel.panel} ${styles.sheet}`} role="dialog" aria-label={`Round ${game.round} results`}>
      <h2 className={panel.title}>Round {game.round} results</h2>
      <p className={styles.sub}>
        <SuitIcon suit={record.trump} className={isRed(record.trump) ? styles.redSuit : undefined} /> {record.hands} hands,{" "}
        {SUIT_NAMES[record.trump]} trump
      </p>

      <div className={styles.table} role="table" aria-label="Round results">
        <div className={`${styles.row} ${styles.head}`} role="row">
          <span role="columnheader">Player</span>
          <span role="columnheader">Called</span>
          <span role="columnheader">Won</span>
          <span role="columnheader">Pts</span>
          <span role="columnheader">Total</span>
        </div>
        {rows.map((seat, i) => {
          const exact = record.judgements[seat] === record.wins[seat];
          return (
            <div
              key={seat}
              role="row"
              className={styles.row}
              data-exact={exact}
              data-lead={top.includes(seat)}
              style={{ "--i": i } as CSSProperties}
            >
              <span role="cell" className={styles.who}>
                <span className={styles.name}>{youOr(view, seat)}</span>
                <small>{exact ? "Called it" : record.wins[seat] > record.judgements[seat] ? "Over" : "Short"}</small>
              </span>
              <span role="cell" className={styles.num}>{record.judgements[seat]}</span>
              <span role="cell" className={styles.num}>{record.wins[seat]}</span>
              <span role="cell" className={styles.gain}>
                {record.points[seat] > 0 ? `+${record.points[seat]}` : "0"}
              </span>
              <span role="cell" className={styles.total}>{game.scores[seat]}</span>
            </div>
          );
        })}
      </div>

      <p className={panel.fine}>
        {top.length > 1 ? `${top.map((s) => youOr(view, s)).join(" and ")} lead` : `${youOr(view, top[0])} ${top[0] === view.you ? "lead" : "leads"}`}
        {" "}after {game.history.length} {game.history.length === 1 ? "round" : "rounds"}.
      </p>

      <button type="button" className={`${panel.primary} ${styles.next}`} disabled={disabled || iAmReady} onClick={onReady}>
        {iAmReady ? `Waiting for others (${waiting} of ${game.players})` : `Deal round ${game.round + 1}`}
      </button>
      {isHost ? (
        <button type="button" className={styles.quit} data-danger={confirmEnd} disabled={disabled} onClick={() => (confirmEnd ? onEnd() : setConfirmEnd(true))}>
          {confirmEnd ? "End the game for everyone?" : "End the game"}
        </button>
      ) : (
        <p className={styles.hint}>The host can end the game from here.</p>
      )}
    </div>
  );
}

/** The result of the whole session: the winner, the standings and every round's points. */
export function FinalResults({ view, game, disabled, onReady }: Omit<RoundProps, "isHost" | "onEnd">) {
  const rows = seatsByScore(game.scores);
  const winners = leaders(game.scores);
  const waiting = game.ready.filter(Boolean).length;
  const iAmReady = game.ready[view.you];
  const rounds = game.history.length;
  const seatsInOrder = game.scores.map((_, seat) => seat);

  const headline =
    winners.length > 1
      ? `${winners.map((s) => youOr(view, s)).join(" and ")} tie`
      : `${youOr(view, winners[0])} ${winners[0] === view.you ? "win" : "wins"}`;

  return (
    <div className={`${panel.panel} ${styles.sheet} ${styles.final}`} role="dialog" aria-label="Final scores">
      <h2 className={panel.title}>Final scores</h2>
      <p className={styles.headline}>{headline}</p>
      <p className={styles.sub}>
        {rounds} {rounds === 1 ? "round" : "rounds"} played
      </p>

      <ul className={styles.standings}>
        {rows.map((seat, i) => (
          <li key={seat} className={styles.stand} data-lead={winners.includes(seat)} style={{ "--i": i } as CSSProperties}>
            <span className={styles.rank}>{winners.includes(seat) ? "★" : i + 1}</span>
            <span className={styles.name}>{youOr(view, seat)}</span>
            <span className={styles.total}>{game.scores[seat]}</span>
          </li>
        ))}
      </ul>

      <div className={styles.scroll}>
        <table className={styles.rounds}>
          <caption>Points by round</caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              {seatsInOrder.map((seat) => (
                <th scope="col" key={seat}>
                  {nameOf(view, seat).slice(0, 7)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {game.history.map((r) => (
              <tr key={r.round}>
                <th scope="row">{r.round}</th>
                {seatsInOrder.map((seat) => (
                  <td key={seat} data-scored={r.points[seat] > 0}>
                    {r.points[seat]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Σ</th>
              {seatsInOrder.map((seat) => (
                <td key={seat}>{game.scores[seat]}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <button type="button" className={`${panel.primary} ${styles.next}`} disabled={disabled || iAmReady} onClick={onReady}>
        {iAmReady ? `Waiting for others (${waiting} of ${game.players})` : "Play again"}
      </button>
    </div>
  );
}

/** Live standings for the scoreboard dialog: this round's call against hands won, and the running total. */
export function ScoreList({ view, game }: { view: TableView; game: GameView }) {
  const rows = seatsByScore(game.scores);
  const top = leaders(game.scores);
  const inRound = game.step === "play" || game.step === "trickDone";
  const started = game.judgements.every((j) => j !== null);
  return (
    <div className={styles.table} role="table" aria-label="Scoreboard">
      <div className={`${styles.row} ${styles.head} ${styles.live}`} role="row">
        <span role="columnheader">Player</span>
        <span role="columnheader">Called</span>
        <span role="columnheader">Won</span>
        <span role="columnheader">Total</span>
      </div>
      {rows.map((seat) => (
        <div key={seat} role="row" className={`${styles.row} ${styles.live}`} data-lead={game.history.length > 0 && top.includes(seat)}>
          <span role="cell" className={styles.who}>
            <span className={styles.name}>{youOr(view, seat)}</span>
            {game.history.length > 0 && top.includes(seat) && <small>Leading</small>}
          </span>
          <span role="cell" className={styles.num}>{game.judgements[seat] ?? "–"}</span>
          <span role="cell" className={styles.num}>{started && inRound ? game.wins[seat] : "–"}</span>
          <span role="cell" className={styles.total}>{game.scores[seat]}</span>
        </div>
      ))}
    </div>
  );
}
