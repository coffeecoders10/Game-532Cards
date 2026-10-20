"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadIdentity } from "./crypto";
import { GuestSession, type GuestStatus } from "./guest";
import { HostSession, type HostEngine } from "./host";
import { socketConnector } from "./room";
import type { TableStorage } from "./storage";
import type { TableViewOf } from "./view";
import type { CommonAction } from "./wire";

export type TableStatus = GuestStatus;

/** What differs between games: where their rooms live, how they are stored and ruled. */
export interface TableAdapter<G, GV, A extends { type: string }> {
  /** Socket room id for a table code, namespaced per game. */
  roomId(code: string): string;
  storage: TableStorage;
  engine: HostEngine<G, GV, A>;
}

interface Controls<A> {
  act(action: A | CommonAction): void;
  leave(): Promise<void>;
}

const NOTICE_MS = 3500;
/** If the host never answers an action, stop treating the table as busy. */
const BUSY_TIMEOUT_MS = 3000;

export interface Notice {
  id: number;
  message: string;
}

/**
 * Connects to a table as its host or as a guest and exposes the player's current view.
 * `busy` is true between sending an action and the host's next view, so the UI can't double-submit.
 */
export function useTableSession<G, GV, A extends { type: string }>(
  adapter: TableAdapter<G, GV, A>,
  code: string,
  name: string,
  hosting: boolean,
) {
  type View = TableViewOf<GV>;
  const [view, setView] = useState<View | null>(null);
  const [status, setStatus] = useState<TableStatus>("connecting");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyVersion, setBusyVersion] = useState<number | null>(null);
  const controls = useRef<Controls<A> | null>(null);
  const viewRef = useRef<View | null>(null);
  const timers = useRef<{ busy?: ReturnType<typeof setTimeout>; notice?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    let cancelled = false;
    let stop = () => {};
    const noticeTimers = timers.current;

    const showNotice = (message: string) => {
      setBusyVersion(null); // a rejected action means the table didn't change
      setNotice({ id: Date.now(), message });
      clearTimeout(noticeTimers.notice);
      noticeTimers.notice = setTimeout(() => setNotice(null), NOTICE_MS);
    };
    const showView = (next: View) => {
      viewRef.current = next;
      setView(next);
    };

    void (async () => {
      const identity = await loadIdentity();
      if (cancelled) return;
      const connect = socketConnector(adapter.roomId(code), identity.id);

      if (hosting) {
        const host = new HostSession<G, GV, A>({
          engine: adapter.engine,
          storage: adapter.storage,
          code,
          identity,
          name,
          connect,
          persist: true,
          callbacks: {
            onView: showView,
            onConnection: (online) => setStatus(online ? "online" : "offline"),
            onNotice: showNotice,
          },
        });
        controls.current = {
          act: (action) => host.act(action),
          leave: async () => {
            await host.close();
            setStatus("left");
          },
        };
        stop = () => host.stop();
        host.start();
      } else {
        const guest = new GuestSession<View, A>({
          identity,
          name,
          connect,
          callbacks: { onView: showView, onStatus: setStatus, onNotice: showNotice },
        });
        controls.current = {
          act: (action) => void guest.act(action),
          leave: () => guest.leave(),
        };
        stop = () => guest.stop();
        guest.start();
      }
    })();

    return () => {
      cancelled = true;
      stop();
      controls.current = null;
      clearTimeout(noticeTimers.busy);
      clearTimeout(noticeTimers.notice);
    };
  }, [adapter, code, name, hosting]);

  const act = useCallback((action: A | CommonAction) => {
    const current = viewRef.current;
    if (current && action.type !== "sync") {
      setBusyVersion(current.v);
      clearTimeout(timers.current.busy);
      timers.current.busy = setTimeout(() => setBusyVersion(null), BUSY_TIMEOUT_MS);
    }
    controls.current?.act(action);
  }, []);

  const leave = useCallback(async () => {
    await controls.current?.leave();
  }, []);

  return {
    view,
    status,
    notice,
    busy: view !== null && busyVersion === view.v,
    act,
    leave,
  };
}
