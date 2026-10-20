"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Card } from "@/lib/cards/cards";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { GameLanding } from "@/components/ui/GameLanding";
import { Panel } from "@/components/ui/Panel";
import { TextField } from "@/components/ui/TextField";
import { useClientValue } from "@/lib/hooks/useClientValue";
import { newRoomCode, normalizeRoomCode } from "@/games/532/net/crypto";
import { MAX_NAME_LENGTH, cleanName } from "@/games/532/net/names";
import { loadName, markHosting, saveName } from "@/games/532/net/storage";
import { Emblem532 } from "./Emblem532";
import styles from "./Game532Home.module.css";

/** A sample hand that shows off the two odd 7s in the deck. */
const FAN: Card[] = [
  { suit: "S", rank: 7 },
  { suit: "D", rank: 12 },
  { suit: "S", rank: 14 },
  { suit: "H", rank: 13 },
  { suit: "H", rank: 7 },
];

/** Landing page for 5-3-2: pick a name, then open a table or join one by code. */
export function Game532Home() {
  const router = useRouter();
  const stored = useClientValue(loadName, "");
  const [typed, setTyped] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const name = typed ?? stored;
  const ready = name.trim().length > 0;

  const enter = (code: string, host: boolean) => {
    saveName(cleanName(name));
    if (host) markHosting(code);
    router.push(`/games/532/room/${code}`);
  };

  return (
    <GameLanding
      name="5-3-2"
      emblem={<Emblem532 animated />}
      tagline="Three players. Ten hands. Win what you promised, then trade for the rest."
      fan={FAN}
    >
      <Panel aria-label="Start playing">
        <TextField
          id="name"
          label="Your name"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="nickname"
          placeholder="Who's sitting down?"
          onChange={(e) => setTyped(e.target.value)}
        />

        <Button className={styles.open} disabled={!ready} onClick={() => enter(newRoomCode(), true)}>
          Open a table
        </Button>

        <Divider>or join friends</Divider>

        <form
          className={styles.join}
          onSubmit={(e) => {
            e.preventDefault();
            if (ready && joinCode.length === 6) enter(joinCode, false);
          }}
        >
          <TextField
            id="code"
            label="Table code"
            hideLabel
            variant="code"
            value={joinCode}
            onChange={(e) => setJoinCode(normalizeRoomCode(e.target.value))}
            placeholder="CODE"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" variant="secondary" disabled={!ready || joinCode.length !== 6}>
            Join
          </Button>
        </form>
      </Panel>
    </GameLanding>
  );
}
