"use client";

import { RoomClient as Room } from "@/components/table/RoomClient";
import { storageJudgement } from "@/games/judgement/net/table";
import { useTable } from "@/games/judgement/net/useTable";
import { Table } from "./Table";

export function RoomClient({ code }: { code: string }) {
  return (
    <Room
      code={code}
      slug="judgement"
      storage={storageJudgement}
      useTable={useTable}
      Table={Table}
      fullText="All six seats are already taken."
    />
  );
}
