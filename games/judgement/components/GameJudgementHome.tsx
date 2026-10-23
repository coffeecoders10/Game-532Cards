"use client";

import type { Card } from "@/lib/cards/cards";
import { GameHome } from "@/components/table/GameHome";
import { storageJudgement } from "@/games/judgement/net/table";
import { EmblemJudgement } from "./EmblemJudgement";

/** A sample hand: a strong spade run, the sort of cards that make you say "four". */
const FAN: Card[] = [
  { suit: "S", rank: 14 },
  { suit: "S", rank: 13 },
  { suit: "H", rank: 14 },
  { suit: "D", rank: 12 },
  { suit: "C", rank: 11 },
];

/** Landing page for Judgement. */
export function GameJudgementHome() {
  return (
    <GameHome
      slug="judgement"
      name="Judgement"
      emblem={<EmblemJudgement animated />}
      tagline="Three to six players. Call your hands before you play, then win exactly that many."
      fan={FAN}
      storage={storageJudgement}
    />
  );
}
