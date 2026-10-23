"use client";

import { type Notice, type TableStatus, useTableSession } from "@/lib/net/useTable";
import { adapterJudgement } from "./table";

export type { Notice, TableStatus };

export const useTable = (code: string, name: string, hosting: boolean) =>
  useTableSession(adapterJudgement, code, name, hosting);
