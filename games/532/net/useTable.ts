"use client";

import { type Notice, type TableStatus, useTableSession } from "@/lib/net/useTable";
import { adapter532 } from "./table";

export type { Notice, TableStatus };

export const useTable = (code: string, name: string, hosting: boolean) =>
  useTableSession(adapter532, code, name, hosting);
