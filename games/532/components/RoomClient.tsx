"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_NAME_LENGTH, cleanName } from "@/games/532/net/names";
import { isHosting, loadName, saveName } from "@/games/532/net/storage";
import { useTable } from "@/games/532/net/useTable";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { Table } from "./Table";
import { useClientValue } from "@/lib/hooks/useClientValue";
import styles from "./RoomClient.module.css";

const BACK = { href: "/games/532", label: "Back to start" };

function NameGate({ code, onName }: { code: string; onName(name: string): void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className={styles.gate}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          const name = cleanName(draft);
          saveName(name);
          onName(name);
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

function Session({ code, name, hosting: initiallyHosting }: { code: string; name: string; hosting: boolean }) {
  const router = useRouter();
  // Fixed for the life of the session: leaving clears the stored flag, which must not turn a host into a guest.
  const [hosting] = useState(initiallyHosting);
  const { view, status, notice, busy, act, leave } = useTable(code, name, hosting);

  useEffect(() => {
    if (status === "left") router.replace("/games/532");
  }, [status, router]);

  if (status === "not-found") {
    return (
      <StatusScreen
        back={BACK}
        title="No table with that code"
        body="Check the code, or ask your host to open the table first. The host has to be in the room for you to join."
      />
    );
  }
  if (status === "full") {
    return <StatusScreen back={BACK} title="This table is full" body="Three players are already seated." />;
  }
  if (status === "closed") {
    return <StatusScreen back={BACK} title="The host closed the table" body="Start a new table to keep playing." />;
  }
  if (status === "left") return <StatusScreen busy title="Heading out…" />;
  if (!view) {
    return (
      <StatusScreen
        busy
        title={status === "connecting" ? "Pulling up a chair…" : hosting ? "Setting the table…" : "Finding the table…"}
        body={status === "connecting" ? "Connecting to the game server." : undefined}
      />
    );
  }

  return (
    <Table
      view={view}
      status={status}
      notice={notice}
      busy={busy}
      isHost={hosting}
      act={act}
      onLeave={() => void leave()}
    />
  );
}

export function RoomClient({ code }: { code: string }) {
  const stored = useClientValue<string | null>(loadName, null);
  const hosting = useClientValue(() => isHosting(code), false);
  const [typed, setTyped] = useState<string | null>(null);
  const name = typed ?? stored;

  if (!/^[A-Z0-9]{6}$/.test(code)) {
    return <StatusScreen back={BACK} title="That isn't a table code" body="Table codes are six letters and numbers." />;
  }
  if (name === null) return <StatusScreen busy title="Pulling up a chair…" />;
  if (name.trim() === "") return <NameGate code={code} onName={setTyped} />;
  return <Session key={code} code={code} name={name} hosting={hosting} />;
}
