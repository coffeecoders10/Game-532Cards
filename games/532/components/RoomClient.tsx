"use client";

import { RoomClient as Room } from "@/components/table/RoomClient";
import { storage532 } from "@/games/532/net/table";
import { useTable } from "@/games/532/net/useTable";
import { Table } from "./Table";

export function RoomClient({ code }: { code: string }) {
  return (
    <Room
      code={code}
      slug="532"
      storage={storage532}
      useTable={useTable}
      Table={Table}
      fullText="Three players are already seated."
    />
  );
}
