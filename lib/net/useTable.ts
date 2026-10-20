"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TableView } from "../game/view";
import { loadIdentity } from "./crypto";
import { GuestSession, type GuestStatus } from "./guest";
import { HostSession } from "./host";
import type { Action } from "./protocol";
import { socketConnector } from "./room";

export type TableStatus = GuestStatus;

interface Controls {
  act(action: Action): void;
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
export function useTable(code: string, name: string, hosting: boolean) {
  const [view, setView] = useState<TableView | null>(null);
  const [status, setStatus] = useState<TableStatus>("connecting");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyVersion, setBusyVersion] = useState<number | null>(null);
  const controls = useRef<Controls | null>(null);
  const viewRef = useRef<TableView | null>(null);
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
    const showView = (next: TableView) => {
      viewRef.current = next;
      setView(next);
    };

    void (async () => {
      const identity = await loadIdentity();
      if (cancelled) return;
      const connect = socketConnector(code, identity.id);

      if (hosting) {
        const host = new HostSession({
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
        const guest = new GuestSession({
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
  }, [code, name, hosting]);

  const act = useCallback((action: Action) => {
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
