"use client";

import { useEffect, useRef, useState } from "react";
import { type Card, SUIT_NAMES, cardKey } from "@/lib/game/cards";
import { legalCards } from "@/lib/game/engine";
import type { GameView, TableView } from "@/lib/game/view";
import type { Action } from "@/lib/net/protocol";
import type { Notice, TableStatus } from "@/lib/net/useTable";
import { Hand } from "./Hand";
import { Lobby } from "./Lobby";
import { ExchangeStage, RoundIntro, RoundSummary, SwapToast, TrumpPicker } from "./Overlays";
import { RulesDialog } from "./RulesDialog";
import { Seat } from "./Seat";
import { SuitIcon } from "./Suit";
import { TrickArea } from "./TrickArea";
import styles from "./Table.module.css";

interface Props {
  view: TableView;
  status: TableStatus;
  notice: Notice | null;
  busy: boolean;
  isHost: boolean;
  act(action: Action): void;
  onLeave(): void;
}

function statusLine(view: TableView, game: GameView | null): string {
  const name = (seat: number) => (seat === view.you ? "You" : (view.seats[seat].name ?? "Player"));
  if (!game) return "";
  switch (game.step) {
    case "trump": {
      const five = game.targets.indexOf(5);
      return five === view.you ? "Choose the trump suit" : `${name(five)} is choosing trump…`;
    }
    case "exchange": {
      const ex = game.exchange;
      if (!ex) return "";
      return ex.taker === view.you
        ? `Give ${name(ex.giver)} a card`
        : `${name(ex.taker)} is trading with ${ex.giver === view.you ? "you" : name(ex.giver)}`;
    }
    case "play": {
      if (game.turn !== view.you) return `${name(game.turn)}'s turn`;
      if (game.trick.length === 0) return "Your lead";
      const led = game.trick[0].card.suit;
      return game.hand.some((c) => c.suit === led) ? `Your turn — follow ${SUIT_NAMES[led]}` : "Your turn — play anything";
    }
    case "trickDone":
      return ""; // the table itself announces the winner
    case "summary":
      return "Round complete";
  }
}

export function Table({ view, status, notice, busy, isHost, act, onLeave }: Props) {
  const game = view.game;
  const you = view.you;
  const rulesRef = useRef<HTMLDialogElement>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [lastSwapSeen, setLastSwapSeen] = useState<number | null>(null);
  const [swapToastOn, setSwapToastOn] = useState(false);

  const leftSeat = (you + 1) % 3;
  const rightSeat = (you + 2) % 3;
  const myTurn = !!game && game.step === "play" && game.turn === you && !view.paused;
  const myExchange = !!game && game.step === "exchange" && game.exchange?.taker === you && !view.paused;
  const iPickTrump = !!game && game.step === "trump" && game.targets[you] === 5 && !view.paused;

  // Show a toast once per exchange you were part of (adjusting state during render, keyed on the swap id).
  const swap = game?.lastSwap;
  const swapId = swap?.received ? swap.id : null;
  if (swapId !== null && swapId !== lastSwapSeen) {
    setLastSwapSeen(swapId);
    setSwapToastOn(true);
  }
  useEffect(() => {
    if (!swapToastOn) return;
    const timer = setTimeout(() => setSwapToastOn(false), 4800);
    return () => clearTimeout(timer);
  }, [swapToastOn, lastSwapSeen]);

  // A nudge on phones when it becomes your turn.
  useEffect(() => {
    // Browsers only allow vibration after the page has had a tap or click.
    if ((myTurn || myExchange || iPickTrump) && navigator.userActivation?.hasBeenActive) navigator.vibrate?.(30);
  }, [myTurn, myExchange, iPickTrump]);

  const choosable =
    myTurn && game
      ? legalCards(game.hand, game.trick)
      : myExchange && game
        ? game.hand
        : null;

  const onChoose = (card: Card) => {
    if (busy) return;
    act({ type: myExchange ? "give" : "play", card });
  };

  const handleLeave = () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      setTimeout(() => setConfirmLeave(false), 3000);
      return;
    }
    onLeave();
  };

  const awayNames = view.seats
    .map((s, i) => (!s.connected && i !== you ? (s.name ?? "A player") : null))
    .filter(Boolean);

  const plate = (seat: number, position: "left" | "right" | "me") => (
    <Seat
      position={position}
      name={view.seats[seat].name}
      connected={view.seats[seat].connected}
      isYou={seat === you}
      target={game?.targets[seat]}
      wins={game?.wins[seat]}
      handCount={game?.handCounts[seat]}
      isTurn={
        !!game && !view.paused && (game.step === "play" ? game.turn === seat : game.step === "trump" ? game.targets[seat] === 5 : game.step === "exchange" ? game.exchange?.taker === seat : false)
      }
      isWinner={!!game && game.step === "trickDone" && game.trickWinner === seat}
    />
  );

  const line = view.paused ? "" : statusLine(view, game);

  return (
    <div className={styles.room}>
      <header className={styles.top}>
        <h1 className={styles.logo} aria-label="5-3-2">
          5·3·2
        </h1>
        {game && (
          <div className={styles.meta}>
            <span>Round {game.round}</span>
            {game.trump && (
              <span className={styles.trump} data-red={game.trump === "H" || game.trump === "D"} key={game.trump}>
                <SuitIcon suit={game.trump} /> Trump
              </span>
            )}
          </div>
        )}
        <div className={styles.tools}>
          <button type="button" className={styles.tool} onClick={() => rulesRef.current?.showModal()}>
            Rules
          </button>
          <button type="button" className={styles.tool} data-danger={confirmLeave} onClick={handleLeave}>
            {confirmLeave ? "Leave table?" : "Leave"}
          </button>
        </div>
      </header>

      <main className={styles.board}>
        <div className={styles.opp} data-side="left">
          {plate(leftSeat, "left")}
        </div>
        <div className={styles.opp} data-side="right">
          {plate(rightSeat, "right")}
        </div>

        <div className={styles.center}>
          {!game && <Lobby view={view} isHost={isHost} disabled={busy || view.paused} onStart={() => act({ type: "start" })} />}

          {game && game.step === "trump" && (
            <>
              <div className={styles.intro}>
                <RoundIntro key={game.round} view={view} game={game} />
              </div>
              {iPickTrump && (
                <div className={styles.delayed}>
                  <TrumpPicker disabled={busy} onPick={(suit) => act({ type: "trump", suit })} />
                </div>
              )}
            </>
          )}

          {game && game.step === "exchange" && <ExchangeStage view={view} game={game} />}

          {game && (game.step === "play" || game.step === "trickDone") && <TrickArea view={view} game={game} />}

          {game && game.step === "summary" && (
            <RoundSummary view={view} game={game} disabled={busy} onReady={() => act({ type: "ready" })} />
          )}
        </div>

        {swapToastOn && swap?.received && swap.gave && (
          <div className={styles.toastDock}>
            <SwapToast key={swap.id} received={swap.received} gave={swap.gave} />
          </div>
        )}
      </main>

      <footer className={styles.mine}>
        <p className={styles.line} aria-live="polite" data-active={myTurn || myExchange || iPickTrump}>
          {line || " "}
        </p>
        {game && game.hand.length > 0 ? (
          <Hand
            cards={game.hand}
            trump={game.trump}
            choosable={choosable}
            freshKey={swap?.received ? cardKey(swap.received) : null}
            onChoose={onChoose}
          />
        ) : (
          <div className={styles.emptyHand} />
        )}
        <div className={styles.myPlate}>{plate(you, "me")}</div>
      </footer>

      {(view.paused || status === "offline" || status === "host-away") && (
        <div className={styles.alert} role="alert">
          {status === "offline"
            ? "Connection lost. Reconnecting…"
            : status === "host-away"
              ? "The host dropped off. Waiting for them to come back…"
              : `Paused — waiting for ${awayNames.join(" and ") || "a player"} to rejoin`}
        </div>
      )}
      {notice && (
        <div className={styles.notice} role="status" key={notice.id}>
          {notice.message}
        </div>
      )}

      <RulesDialog dialogRef={rulesRef} />
    </div>
  );
}
