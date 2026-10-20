"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { NameGate } from "@/components/table/NameGate";
import { StatusScreen } from "@/components/ui/StatusScreen";
import { useClientValue } from "@/lib/hooks/useClientValue";
import type { TableStorage } from "@/lib/net/storage";
import type { Notice, TableStatus } from "@/lib/net/useTable";
import type { CommonAction } from "@/lib/net/wire";

/** What a game's table component receives. */
export interface TableProps<V, A> {
  view: V;
  status: TableStatus;
  notice: Notice | null;
  busy: boolean;
  isHost: boolean;
  act(action: A | CommonAction): void;
  onLeave(): void;
}

interface Props<V, A> {
  code: string;
  slug: string;
  storage: TableStorage;
  /** The game's table hook, e.g. `useTable` from its `net/` folder. */
  useTable(
    code: string,
    name: string,
    hosting: boolean,
  ): {
    view: V | null;
    status: TableStatus;
    notice: Notice | null;
    busy: boolean;
    act(action: A | CommonAction): void;
    leave(): Promise<void>;
  };
  Table: ComponentType<TableProps<V, A>>;
  /** Shown when every seat is taken, e.g. "Three players are already seated." */
  fullText: string;
}

function Session<V, A>({
  code,
  name,
  hosting: initiallyHosting,
  slug,
  useTable,
  Table,
  fullText,
}: Omit<Props<V, A>, "storage"> & { name: string; hosting: boolean }) {
  const back = { href: `/games/${slug}`, label: "Back to start" };
  const router = useRouter();
  // Fixed for the life of the session: leaving clears the stored flag, which must not turn a host into a guest.
  const [hosting] = useState(initiallyHosting);
  const { view, status, notice, busy, act, leave } = useTable(code, name, hosting);

  useEffect(() => {
    if (status === "left") router.replace(`/games/${slug}`);
  }, [status, router, slug]);

  if (status === "not-found") {
    return (
      <StatusScreen
        back={back}
        title="No table with that code"
        body="Check the code, or ask your host to open the table first. The host has to be in the room for you to join."
      />
    );
  }
  if (status === "full") return <StatusScreen back={back} title="This table is full" body={fullText} />;
  if (status === "closed") {
    return <StatusScreen back={back} title="The host closed the table" body="Start a new table to keep playing." />;
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

/** The room route's client side: validates the code, asks for a name if needed, then seats the player. */
export function RoomClient<V, A>({ code, storage, ...rest }: Props<V, A>) {
  const stored = useClientValue<string | null>(storage.loadName, null);
  const hosting = useClientValue(() => storage.isHosting(code), false);
  const [typed, setTyped] = useState<string | null>(null);
  const name = typed ?? stored;

  if (!/^[A-Z0-9]{6}$/.test(code)) {
    return (
      <StatusScreen
        back={{ href: `/games/${rest.slug}`, label: "Back to start" }}
        title="That isn't a table code"
        body="Table codes are six letters and numbers."
      />
    );
  }
  if (name === null) return <StatusScreen busy title="Pulling up a chair…" />;
  if (name.trim() === "") {
    return (
      <NameGate
        code={code}
        onName={(typedName) => {
          storage.saveName(typedName);
          setTyped(typedName);
        }}
      />
    );
  }
  return <Session key={code} code={code} name={name} hosting={hosting} {...rest} />;
}
