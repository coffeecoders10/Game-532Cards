"use client";

import { useState } from "react";
import { MAX_NAME_LENGTH, cleanName } from "@/lib/net/names";
import styles from "./NameGate.module.css";

/** Shown when someone follows an invite link without a saved name. */
export function NameGate({ code, onName }: { code: string; onName(name: string): void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className={styles.gate}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          onName(cleanName(draft));
        }}
      >
        <h1>Join table {code}</h1>
        <label htmlFor="name">What should we call you?</label>
        <input
          id="name"
          autoFocus
          autoComplete="nickname"
          maxLength={MAX_NAME_LENGTH}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Your name"
        />
        <button type="submit" disabled={draft.trim().length === 0}>
          Sit down
        </button>
      </form>
    </div>
  );
}
