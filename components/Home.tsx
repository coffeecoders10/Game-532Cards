"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { Card } from "@/lib/game/cards";
import { newRoomCode, normalizeRoomCode } from "@/lib/net/crypto";
import { MAX_NAME_LENGTH, cleanName } from "@/lib/net/names";
import { loadName, markHosting, saveName } from "@/lib/net/storage";
import { PlayingCard } from "./PlayingCard";
import { useClientValue } from "./useClientValue";
import styles from "./Home.module.css";

/** A sample hand that shows off the two odd 7s in the deck. */
const FAN: Card[] = [
  { suit: "S", rank: 7 },
  { suit: "D", rank: 12 },
  { suit: "S", rank: 14 },
  { suit: "H", rank: 13 },
  { suit: "H", rank: 7 },
];

export function Home() {
  const router = useRouter();
  const stored = useClientValue(loadName, "");
  const [typed, setTyped] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const name = typed ?? stored;
  const ready = name.trim().length > 0;

  const enter = (code: string, host: boolean) => {
    saveName(cleanName(name));
    if (host) markHosting(code);
    router.push(`/room/${code}`);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title} aria-label="5-3-2">
          <span>5</span>
          <span>3</span>
          <span>2</span>
        </h1>
        <p className={styles.tagline}>Three players. Ten hands. Win what you promised, then trade for the rest.</p>
        <div className={styles.fan} aria-hidden="true">
          {FAN.map((card, i) => (
            <PlayingCard key={i} card={card} style={{ "--d": i - 2, "--k": i } as CSSProperties} className={styles.fanCard} />
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-label="Start playing">
        <label htmlFor="name" className={styles.label}>
          Your name
        </label>
        <input
          id="name"
          className={styles.input}
          value={name}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="nickname"
          placeholder="Who's sitting down?"
          onChange={(e) => setTyped(e.target.value)}
        />

        <button type="button" className={styles.primary} disabled={!ready} onClick={() => enter(newRoomCode(), true)}>
          Open a table
        </button>

        <div className={styles.or} aria-hidden="true">
          <span>or join friends</span>
        </div>

        <form
          className={styles.join}
          onSubmit={(e) => {
            e.preventDefault();
            if (ready && joinCode.length === 6) enter(joinCode, false);
          }}
        >
          <label htmlFor="code" className={styles.srOnly}>
            Table code
          </label>
          <input
            id="code"
            className={`${styles.input} ${styles.code}`}
            value={joinCode}
            onChange={(e) => setJoinCode(normalizeRoomCode(e.target.value))}
            placeholder="CODE"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className={styles.secondary} disabled={!ready || joinCode.length !== 6}>
            Join
          </button>
        </form>
      </section>
    </main>
  );
}
