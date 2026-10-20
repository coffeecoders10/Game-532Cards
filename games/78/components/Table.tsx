"use client";

import { useEffect, useMemo, useState } from "react";
import { type Card, SUIT_NAMES, cardKey } from "@/lib/cards/cards";
import { useMediaQuery } from "@/lib/hooks/useClientValue";
import { Lobby } from "@/components/table/Lobby";
import type { TableProps } from "@/components/table/RoomClient";
import { Seat } from "@/components/table/Seat";
import { TableShell, TrumpChip } from "@/components/table/TableShell";
import { TrumpPicker } from "@/components/table/TrumpPicker";
import { type Place, availableCards, eightSeat, legalPlays } from "@/games/78/game/engine";
import type { GameView, TableView } from "@/games/78/game/view";
import type { GameAction } from "@/games/78/net/protocol";
import { Hand } from "./Hand";
import { DealIntro, DealSummary, SwapPanel, SwapToast } from "./Overlays";
import { Rules78 } from "./Rules78";
import { TableCards } from "./TableCards";
import { TrickArea } from "./TrickArea";
import styles from "./Table.module.css";

/** A pickable card is named by where it is: `h:<card>` in your hand, `m:<n>` your column n, `o:<n>` theirs. */
const handKey = (card: Card) => `h:${cardKey(card)}`;
const placeKey = (place: Place) => (place.zone === "hand" ? handKey(place.card) : `m:${place.slot}`);

const slotsOf = (keys: ReadonlySet<string>, prefix: string) =>
  new Set([...keys].filter((k) => k.startsWith(prefix)).map((k) => Number(k.slice(2))));

function statusLine(view: TableView, game: GameView | null): string {
  if (!game) return "";
  const name = (seat: number) => (seat === view.you ? "You" : (view.seats[seat].name ?? "Player"));
  switch (game.step) {
    case "trump": {
      const eight = eightSeat(game);
      return eight === view.you ? "Choose the trump suit" : `${name(eight)} is choosing trump…`;
    }
    case "exchange": {
      const swap = game.swap;
      if (!swap) return "";
      if (swap.taker !== view.you) return `${name(swap.taker)} is swapping with you`;
      return swap.pending ? "Choose a card to give back" : "Choose a card to take";
    }
    case "play": {
      if (game.turn !== view.you) return `${name(game.turn)}'s turn`;
      if (game.trick.length === 0) return "Your lead";
      const led = game.trick[0].card.suit;
      const follows = availableCards(game.hand, game.table[view.you]).some((o) => o.card.suit === led);
      return follows ? `Your turn — follow ${SUIT_NAMES[led]}` : "Your turn — play anything";
    }
    case "trickDone":
      return ""; // the table itself announces the winner
    case "summary":
      return "Deal complete";
  }
}

export function Table({ view, status, notice, busy, isHost, act, onLeave }: TableProps<TableView, GameAction>) {
  const game = view.game;
  const you = view.you;
  const opp = 1 - you;
  const touch = useMediaQuery("(pointer: coarse)");
  const [selected, setSelected] = useState<string | null>(null);
  const [lastSwapSeen, setLastSwapSeen] = useState<number | null>(null);
  const [swapToastOn, setSwapToastOn] = useState(false);

  const live = !!game && !view.paused;
  const myTurn = live && game.step === "play" && game.turn === you;
  const iPickTrump = live && game.step === "trump" && game.roles[you] === 8;
  const swap = live && game.step === "exchange" ? game.swap : null;
  const takePhase = !!swap && swap.taker === you && !swap.pending;
  const givePhase = !!swap && swap.taker === you && !!swap.pending;

  // Show a toast once per swap you were part of (adjusting state during render, keyed on the swap id).
  const lastSwap = game?.lastSwap ?? null;
  const swapId = lastSwap?.received ? lastSwap.id : null;
  if (swapId !== null && swapId !== lastSwapSeen) {
    setLastSwapSeen(swapId);
    setSwapToastOn(true);
  }
  useEffect(() => {
    if (!swapToastOn) return;
    const timer = setTimeout(() => setSwapToastOn(false), 4800);
    return () => clearTimeout(timer);
  }, [swapToastOn, lastSwapSeen]);

  // A nudge on phones when it becomes your move.
  const myMove = myTurn || takePhase || givePhase || iPickTrump;
  useEffect(() => {
    // Browsers only allow vibration after the page has had a tap or click.
    if (myMove && navigator.userActivation?.hasBeenActive) navigator.vibrate?.(30);
  }, [myMove]);

  /** Every card that can be picked right now, by key; null when nothing is being picked. */
  const pickable = useMemo<ReadonlySet<string> | null>(() => {
    if (!game) return null;
    if (myTurn) {
      return new Set(legalPlays(game.hand, game.table[you], game.trick).map((o) => placeKey(o.place)));
    }
    if (givePhase) {
      return new Set(availableCards(game.hand, game.table[you]).map((o) => placeKey(o.place)));
    }
    if (takePhase) {
      const keys = game.table[opp].flatMap((stack, slot) => (stack.up ? [`o:${slot}`] : []));
      return new Set(keys);
    }
    return null;
  }, [game, myTurn, givePhase, takePhase, you, opp]);

  // A selection only makes sense while that card is still pickable.
  const active = selected && pickable?.has(selected) ? selected : null;

  const toPlace = (key: string): Place | null => {
    if (!game) return null;
    if (key.startsWith("m:")) return { zone: "table", slot: Number(key.slice(2)) };
    const card = game.hand.find((c) => handKey(c) === key);
    return card ? { zone: "hand", card } : null;
  };

  const pick = (key: string) => {
    if (busy) return;
    if (myTurn) {
      // Phones take two taps, so a card is never played by a stray touch.
      if (touch && active !== key) {
        setSelected(key);
        return;
      }
      const place = toPlace(key);
      setSelected(null);
      if (place) act({ type: "play", place });
      return;
    }
    setSelected(active === key ? null : key);
  };

  const takeSelected = () => {
    if (busy || !active?.startsWith("o:")) return;
    act({ type: "take", source: { zone: "table", slot: Number(active.slice(2)) } });
    setSelected(null);
  };
  const giveSelected = () => {
    const place = active ? toPlace(active) : null;
    if (busy || !place) return;
    act({ type: "give", place });
    setSelected(null);
  };

  const awayNames = view.seats
    .map((s, i) => (!s.connected && i !== you ? (s.name ?? "A player") : null))
    .filter(Boolean);
  const alert =
    status === "offline"
      ? "Connection lost. Reconnecting…"
      : status === "host-away"
        ? "The host dropped off. Waiting for them to come back…"
        : view.paused
          ? `Paused — waiting for ${awayNames.join(" and ") || "a player"} to rejoin`
          : null;

  const plate = (seat: number, position: "top" | "me") => (
    <Seat
      position={position}
      back="rosette"
      name={view.seats[seat].name}
      connected={view.seats[seat].connected}
      isYou={seat === you}
      target={game?.roles[seat]}
      wins={game?.wins[seat]}
      handCount={game?.handCounts[seat]}
      isTurn={
        live &&
        (game.step === "play"
          ? game.turn === seat
          : game.step === "trump"
            ? game.roles[seat] === 8
            : game.step === "exchange"
              ? game.swap?.taker === seat
              : false)
      }
      isWinner={!!game && game.step === "trickDone" && game.trickWinner === seat}
    />
  );

  // Where a swap's card landed on my side, so it can glow.
  const landed = lastSwap?.received ? (lastSwap.taker === you ? lastSwap.givenFrom : lastSwap.takenFrom) : null;
  const freshHand = landed?.zone === "hand" && lastSwap?.received ? handKey(lastSwap.received) : null;
  const freshSlot = landed?.zone === "table" ? landed.slot : null;
  // The column an in-progress swap is aimed at.
  const aimed = swap?.pending?.source.zone === "table" ? swap.pending.source.slot : null;

  const handChoosable = pickable && (myTurn || givePhase) ? new Set([...pickable].filter((k) => k.startsWith("h:")).map((k) => k.slice(2))) : null;
  const dealing = !!game && game.tricksPlayed === 0 && game.trick.length === 0;
  const line = view.paused ? "" : statusLine(view, game);
  const hasSelection = active !== null;

  return (
    <TableShell
      name="7-8"
      logo="7·8"
      meta={
        game && (
          <>
            <span>Deal {game.deal}</span>
            {game.trump && <TrumpChip suit={game.trump} />}
          </>
        )
      }
      rulesTitle="How 7-8 plays"
      rules={<Rules78 />}
      alert={alert}
      notice={notice}
      onLeave={onLeave}
    >
      <main className={styles.board}>
        <div className={styles.side}>{plate(opp, "top")}</div>

        {game && (
          <TableCards
            stacks={game.table[opp]}
            side="theirs"
            trump={game.trump}
            choosable={takePhase && pickable ? slotsOf(pickable, "o:") : null}
            selected={active?.startsWith("o:") ? Number(active.slice(2)) : null}
            marked={swap && swap.giver === opp ? aimed : null}
            fresh={null}
            dealing={dealing}
            label={`${view.seats[opp].name ?? "Opponent"}'s table cards`}
            onChoose={(slot) => pick(`o:${slot}`)}
          />
        )}

        <div className={styles.center}>
          {line && (
            <p className={styles.line} aria-live="polite" data-active={myMove}>
              {line}
            </p>
          )}

          {game && (game.step === "play" || game.step === "trickDone") && (
            <p className={styles.count}>
              Hand {Math.min(game.tricksPlayed + 1, 15)} of 15
            </p>
          )}

          {!game && <Lobby view={view} slug="78" title="7-8" isHost={isHost} disabled={busy || view.paused} onStart={() => act({ type: "start" })} />}

          {game && game.step === "trump" && (
            <div className={styles.intro}>
              <DealIntro key={game.deal} view={view} game={game} />
            </div>
          )}

          {game && swap && (
            <SwapPanel
              view={view}
              game={game}
              hasSelection={hasSelection}
              disabled={busy}
              onTakeSelected={takeSelected}
              onTakeBlind={() => act({ type: "take", source: { zone: "hand" } })}
              onGive={giveSelected}
            />
          )}

          {game && (game.step === "play" || game.step === "trickDone") && <TrickArea view={view} game={game} />}

          {swapToastOn && lastSwap?.received && lastSwap.gave && (
            <div className={styles.toastDock}>
              <SwapToast key={lastSwap.id} received={lastSwap.received} gave={lastSwap.gave} />
            </div>
          )}
        </div>

        <div className={styles.side}>{plate(you, "me")}</div>

        {game && (
          <TableCards
            stacks={game.table[you]}
            side="mine"
            trump={game.trump}
            choosable={pickable && (myTurn || givePhase) ? slotsOf(pickable, "m:") : null}
            selected={active?.startsWith("m:") ? Number(active.slice(2)) : null}
            marked={swap && swap.giver === you ? aimed : null}
            fresh={freshSlot}
            dealing={dealing}
            label="Your table cards"
            onChoose={(slot) => pick(`m:${slot}`)}
          />
        )}

        {iPickTrump && game && (
          <div className={`${styles.overlay} ${styles.delayed}`}>
            <TrumpPicker
              hint="You are the 8, so you choose the suit that beats all others this deal — and you lead."
              disabled={busy}
              onPick={(suit) => act({ type: "trump", suit })}
            />
          </div>
        )}

        {game && game.step === "summary" && (
          <div className={styles.overlay} data-dim>
            <DealSummary view={view} game={game} disabled={busy} onReady={() => act({ type: "ready" })} onLeave={onLeave} />
          </div>
        )}

      </main>

      <footer className={styles.mine}>
        {game && game.hand.length > 0 ? (
          <Hand
            cards={game.hand}
            trump={game.trump}
            choosable={handChoosable}
            selected={active?.startsWith("h:") ? active.slice(2) : null}
            freshKey={freshHand ? freshHand.slice(2) : null}
            onChoose={(card) => pick(handKey(card))}
          />
        ) : (
          <div className={styles.emptyHand} />
        )}
      </footer>
    </TableShell>
  );
}
