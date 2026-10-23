import type { Card, Suit } from "@/lib/cards/cards";
import type { TableViewOf } from "@/lib/net/view";
import type { Game, RoundRecord, Step, TrickPlay } from "./engine";

/**
 * What one player is allowed to see. The host builds one per seat and sends it encrypted to
 * that seat only: other hands never leave the host. Judgements, tricks and scores are public.
 */
export interface GameView {
  round: number;
  players: number;
  handSize: number;
  step: Step;
  trump: Suit;
  starter: number;
  judgements: (number | null)[];
  turn: number;
  trick: TrickPlay[];
  trickWinner: number | null;
  tricksPlayed: number;
  wins: number[];
  handCounts: number[];
  hand: Card[];
  scores: number[];
  history: RoundRecord[];
  ready: boolean[];
}

export type TableView = TableViewOf<GameView>;

export function gameViewFor(g: Game, seat: number): GameView {
  return {
    round: g.round,
    players: g.players,
    handSize: g.handSize,
    step: g.step,
    trump: g.trump,
    starter: g.starter,
    judgements: g.judgements,
    turn: g.turn,
    trick: g.trick,
    trickWinner: g.trickWinner,
    tricksPlayed: g.tricksPlayed,
    wins: g.wins,
    handCounts: g.hands.map((h) => h.length),
    hand: g.hands[seat],
    scores: g.scores,
    history: g.history,
    ready: g.ready,
  };
}
