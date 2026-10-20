"use client";

import { useState } from "react";
import type { TableView } from "@/lib/game/view";
import { useClientValue } from "./useClientValue";
import styles from "./Overlays.module.css";
import lobby from "./Lobby.module.css";

interface Props {
  view: TableView;
  isHost: boolean;
  disabled: boolean;
  onStart(): void;
}

/** Waiting room shown on the felt until three players are seated. */
export function Lobby({ view, isHost, disabled, onStart }: Props) {
  const [copied, setCopied] = useState(false);
  const link = useClientValue(() => `${location.origin}/room/${view.code}`, "");
  const canShare = useClientValue(() => typeof navigator.share === "function", false);
  const seated = view.seats.filter((s) => s.name !== null && s.connected).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the code and link are still on screen to copy by hand.
    }
  };

  return (
    <div className={styles.panel}>
      <p className={lobby.label}>Table code</p>
      <p className={lobby.code} aria-label={view.code.split("").join(" ")}>
        {view.code}
      </p>
      <div className={lobby.actions}>
        <button type="button" className={lobby.secondary} onClick={copy}>
          {copied ? "Link copied" : "Copy invite link"}
        </button>
        {canShare && (
          <button
            type="button"
            className={lobby.secondary}
            onClick={() => navigator.share({ title: "Join my 5-3-2 table", url: link }).catch(() => {})}
          >
            Share
          </button>
        )}
      </div>

      <p className={styles.hint} role="status">
        {seated < 3
          ? `${seated} of 3 players seated. Send the code to ${3 - seated === 1 ? "one more friend" : "two friends"}.`
          : isHost
            ? "Everyone's here."
            : "Everyone's here. Waiting for the host to deal."}
      </p>

      {isHost && (
        <button type="button" className={`${styles.primary} ${lobby.start}`} disabled={disabled || seated < 3} onClick={onStart}>
          Deal the cards
        </button>
      )}
    </div>
  );
}
