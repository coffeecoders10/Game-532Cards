import { createStorage } from "@/lib/net/storage";
import type { TableAdapter } from "@/lib/net/useTable";
import { MAX_PLAYERS, MIN_PLAYERS, type Game, collectTrick, endGame, judge, markReady, newGame, playCard } from "../game/engine";
import { type GameView, gameViewFor } from "../game/view";
import { roomIdFor } from "./config";
import { type GameAction, parseGameAction } from "./protocol";

/** How long a finished hand stays on the table before it is swept to the winner. */
export const TRICK_PAUSE_MS = 2300;

export const storageJudgement = createStorage("judgementcards");

/** Plugs the Judgement rules into the shared host/guest sessions. */
export const adapterJudgement: TableAdapter<Game, GameView, GameAction> = {
  roomId: roomIdFor,
  storage: storageJudgement,
  engine: {
    seats: MAX_PLAYERS,
    minSeats: MIN_PLAYERS,
    startError: "At least three players are needed.",
    newGame,
    act(game, seat, action, randomInt) {
      switch (action.type) {
        case "judge":
          return judge(game, seat, action.count);
        case "play":
          return playCard(game, seat, action.card);
        case "ready":
          return markReady(game, seat, randomInt);
        case "end":
          return endGame(game, seat);
      }
    },
    view: gameViewFor,
    parseAction: parseGameAction,
    auto: (game) => (game.step === "trickDone" ? { delayMs: TRICK_PAUSE_MS, run: collectTrick } : null),
  },
};
