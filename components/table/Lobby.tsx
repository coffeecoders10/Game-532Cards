"use client";

import { useState } from "react";
import { useClientValue } from "@/lib/hooks/useClientValue";
import panel from "./TablePanel.module.css";
import styles from "./Lobby.module.css";

interface Props {
  view: { code: string; seats: { name: string | null; connected: boolean }[] };
  /** Route segment of the game, for the invite link: `/games/<slug>/room/<code>`. */
  slug: string;
  /** Game name, for the share sheet. */
  title: string;
  isHost: boolean;
  disabled: boolean;
  onStart(): void;
}

/** Waiting room shown on the felt until every seat is filled. */
export function Lobby({ view, slug, title, isHost, disabled, onStart }: Props) {
  const [copied, setCopied] = useState(false);
  const link = useClientValue(() => `${location.origin}/games/${slug}/room/${view.code}`, "");
  const canShare = useClientValue(() => typeof navigator.share === "function", false);
  const total = view.seats.length;
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
    <div className={panel.panel}>
      <p className={styles.label}>Table code</p>
      <p className={styles.code} aria-label={view.code.split("").join(" ")}>
        {view.code}
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={copy}>
          {copied ? "Link copied" : "Copy invite link"}
        </button>
        {canShare && (
          <button
            type="button"
            className={styles.secondary}
            onClick={() => navigator.share({ title: `Join my ${title} table`, url: link }).catch(() => {})}
          >
            Share
          </button>
        )}
      </div>

      <p className={panel.hint} role="status">
        {seated < total
          ? `${seated} of ${total} players seated. Send the code to ${total - seated === 1 ? "one more friend" : "two friends"}.`
          : isHost
            ? "Everyone's here."
            : "Everyone's here. Waiting for the host to deal."}
      </p>

      {isHost && (
        <button type="button" className={`${panel.primary} ${styles.start}`} disabled={disabled || seated < total} onClick={onStart}>
          Deal the cards
        </button>
      )}
    </div>
  );
}
