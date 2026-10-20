import type { Card, Suit } from "@/lib/cards/cards";
import type { SeatView, TableViewOf } from "@/lib/net/view";
import type { ExchangeRight, Game, RoundSummary, Step, TrickPlay } from "./engine";

/**
 * What one player is allowed to see. The host builds one of these per seat and sends it
 * encrypted to that seat only, so other players' hands and undealt cards never leave the host.
 */

export interface ExchangeView {
  taker: number;
  giver: number;
  /** The randomly drawn card; only the taker sees it. */
  card: Card | null;
  /** Exchanges still to play, including this one. */
  remaining: number;
}

export interface SwapNotice {
  id: number;
  taker: number;
  giver: number;
  /** Only the two players involved see the cards: what they received and what they gave away. */
  received: Card | null;
  gave: Card | null;
}

export interface GameView {
  round: number;
  step: Step;
  trump: Suit | null;
  targets: number[];
  wins: number[];
  handCounts: number[];
  leader: number;
  turn: number;
  trick: TrickPlay[];
  trickWinner: number | null;
  tricksPlayed: number;
  hand: Card[];
  exchange: ExchangeView | null;
  lastSwap: SwapNotice | null;
  summary: RoundSummary | null;
  ready: boolean[];
  made: number[];
  roundsPlayed: number;
}

export type { SeatView };
export type TableView = TableViewOf<GameView>;

export function gameViewFor(g: Game, seat: number): GameView {
  const exchange = g.step === "exchange" && g.owed.length > 0 ? g.owed[0] : null;
  const swap = g.lastSwap;
  const involved = (s: ExchangeRight | null) => s !== null && (s.taker === seat || s.giver === seat);
  return {
    round: g.round,
    step: g.step,
    trump: g.trump,
    targets: g.targets,
    wins: g.wins,
    handCounts: g.hands.map((h) => h.length),
    leader: g.leader,
    turn: g.turn,
    trick: g.trick,
    trickWinner: g.trickWinner,
    tricksPlayed: g.tricksPlayed,
    hand: g.hands[seat],
    exchange: exchange
      ? {
          taker: exchange.taker,
          giver: exchange.giver,
          card: exchange.taker === seat ? g.swapCard : null,
          remaining: g.owed.length,
        }
      : null,
    lastSwap: swap
      ? {
          id: swap.id,
          taker: swap.taker,
          giver: swap.giver,
          received: involved(swap) ? (swap.taker === seat ? swap.taken : swap.given) : null,
          gave: involved(swap) ? (swap.taker === seat ? swap.given : swap.taken) : null,
        }
      : null,
    summary: g.summary,
    ready: g.ready,
    made: g.made,
    roundsPlayed: g.roundsPlayed,
  };
}
