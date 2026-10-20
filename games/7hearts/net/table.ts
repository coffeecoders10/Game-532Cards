import { createStorage } from "@/lib/net/storage";
import type { TableAdapter } from "@/lib/net/useTable";
import { MAX_PLAYERS, MIN_PLAYERS, type Game, markReady, newGame, pass, playCard } from "../game/engine";
import { type GameView, gameViewFor } from "../game/view";
import { roomIdFor } from "./config";
import { type GameAction, parseGameAction } from "./protocol";

export const storage7hearts = createStorage("7heartscards");

/** Plugs the 7 of Hearts rules into the shared host/guest sessions. */
export const adapter7hearts: TableAdapter<Game, GameView, GameAction> = {
  roomId: roomIdFor,
  storage: storage7hearts,
  engine: {
    seats: MAX_PLAYERS,
    minSeats: MIN_PLAYERS,
    startError: "At least three players are needed.",
    newGame,
    act(game, seat, action, randomInt) {
      switch (action.type) {
        case "play":
          return playCard(game, seat, action.card);
        case "pass":
          return pass(game, seat);
        case "ready":
          return markReady(game, seat, randomInt);
      }
    },
    view: gameViewFor,
    parseAction: parseGameAction,
  },
};
