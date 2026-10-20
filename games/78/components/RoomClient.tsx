"use client";

import { RoomClient as Room } from "@/components/table/RoomClient";
import { storage78 } from "@/games/78/net/table";
import { useTable } from "@/games/78/net/useTable";
import { Table } from "./Table";

export function RoomClient({ code }: { code: string }) {
  return (
    <Room
      code={code}
      slug="78"
      storage={storage78}
      useTable={useTable}
      Table={Table}
      fullText="Both seats are already taken."
    />
  );
}
