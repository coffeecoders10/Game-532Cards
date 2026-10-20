import { type Identity, deriveSharedKey, open, samePublicKey, seal } from "./crypto";
import { cleanName } from "./names";
import type { RoomConnector, RoomLink } from "./room";
import { type CommonAction, type Wire, parseToGuest } from "./wire";

/** How a guest relates to the table, for the UI. */
export type GuestStatus =
  | "connecting" // socket not up yet
  | "searching" // in the room, waiting for the host to answer
  | "online"
  | "host-away" // the host's connection dropped; they can resume
  | "offline" // our own connection dropped
  | "not-found"
  | "full"
  | "closed" // the host ended the table
  | "left";

export interface GuestCallbacks<V> {
  onView(view: V): void;
  onStatus(status: GuestStatus): void;
  onNotice(message: string): void;
}

export interface GuestOptions<V> {
  identity: Identity;
  name: string;
  connect: RoomConnector;
  callbacks: GuestCallbacks<V>;
}

const HELLO_RETRY_MS = 2000;
/** While seated, ask for the current view this often so a dropped message can't leave us stale. */
const SYNC_INTERVAL_MS = 5000;
const HELLO_ATTEMPTS = 5;

/**
 * A guest never holds game state. It sends intents to the host and renders whatever
 * private view the host sends back. The first host to answer is pinned for the session,
 * so a later impostor in the room cannot take over.
 */
export class GuestSession<V extends { v: number }, A> {
  private link: RoomLink | null = null;
  private host: { id: string; pk: JsonWebKey } | null = null;
  private hostKey: CryptoKey | null = null;
  private hostPresent = false;
  private lastVersion = -1;
  private connected = false;
  private joined = false;
  private terminal: GuestStatus | null = null;
  private retry: ReturnType<typeof setInterval> | null = null;
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly opts: GuestOptions<V>) {}

  start() {
    this.setStatus();
    this.link = this.opts.connect({
      onConnect: () => {
        this.connected = true;
        this.sayHello();
        this.setStatus();
      },
      onDisconnect: () => {
        this.connected = false;
        this.setStatus();
      },
      onStatus: (users) => {
        this.hostPresent = this.host !== null && users.includes(this.host.id);
        this.setStatus();
      },
      onWire: (wire) => void this.handleWire(wire),
    });
  }

  stop() {
    this.stopRetry();
    if (this.syncTimer) clearInterval(this.syncTimer);
    this.syncTimer = null;
    this.link?.close();
    this.link = null;
  }

  async act(action: A | CommonAction) {
    if (!this.hostKey || !this.host || !this.link) return;
    const box = await seal(this.hostKey, { k: "act", action });
    this.link?.send({ t: "box", from: this.opts.identity.id, to: this.host.id, ...box });
  }

  /** Gives up the seat and disconnects. */
  async leave() {
    await this.act({ type: "leave" });
    this.terminal = "left";
    this.stop();
    this.setStatus();
  }

  // ------------------------------------------------------------------ status

  private setStatus() {
    this.opts.callbacks.onStatus(this.currentStatus());
  }

  private currentStatus(): GuestStatus {
    if (this.terminal) return this.terminal;
    if (!this.connected) return this.joined ? "offline" : "connecting";
    if (!this.joined) return "searching";
    return this.hostPresent ? "online" : "host-away";
  }

  // --------------------------------------------------------------- handshake

  private sayHello() {
    const { identity, name } = this.opts;
    const hello = () =>
      this.link?.send({ t: "hello", id: identity.id, name: cleanName(name), pk: identity.pub });
    hello();
    if (this.joined || this.retry) return;
    let attempts = 1;
    this.retry = setInterval(() => {
      if (this.joined || !this.connected) {
        this.stopRetry();
        return;
      }
      if (++attempts > HELLO_ATTEMPTS) {
        this.terminal = "not-found";
        this.stop();
        this.setStatus();
        return;
      }
      hello();
    }, HELLO_RETRY_MS);
  }

  private stopRetry() {
    if (this.retry) clearInterval(this.retry);
    this.retry = null;
  }

  private async handleWire(wire: Wire) {
    const me = this.opts.identity.id;
    if (wire.t === "host") {
      if (wire.to !== undefined && wire.to !== me) return;
      if (this.host) {
        // Pinned: ignore anyone claiming to be a different host, or the same id with a different key.
        if (wire.id !== this.host.id || !samePublicKey(wire.pk, this.host.pk)) return;
      } else {
        // Only a host reply addressed to us is pinned; a broadcast just prompts us to say hello.
        if (wire.to !== me) {
          this.sayHello();
          return;
        }
        this.host = { id: wire.id, pk: wire.pk };
        this.hostKey = await deriveSharedKey(this.opts.identity.priv, wire.pk);
      }
      this.hostPresent = true;
      // A broadcast announcement means the host (re)started: introduce ourselves again.
      if (wire.to === undefined) this.sayHello();
      this.setStatus();
    } else if (wire.t === "full" && wire.to === me) {
      this.terminal = "full";
      this.stop();
      this.setStatus();
    } else if (wire.t === "box" && wire.to === me && this.host && wire.from === this.host.id) {
      await this.handleBox(wire);
    }
  }

  private async handleBox(box: Extract<Wire, { t: "box" }>) {
    if (!this.hostKey) return;
    const message = parseToGuest<V>(await open(this.hostKey, box));
    if (!message) return;
    if (message.k === "view") {
      // Equal versions are accepted: that is the host answering a sync with the same state.
      if (message.view.v < this.lastVersion) return;
      this.lastVersion = message.view.v;
      this.joined = true;
      this.syncTimer ??= setInterval(() => {
        if (this.connected) void this.act({ type: "sync" });
      }, SYNC_INTERVAL_MS);
      this.hostPresent = true;
      this.stopRetry();
      this.opts.callbacks.onView(message.view);
      this.setStatus();
    } else if (message.k === "error") {
      this.opts.callbacks.onNotice(message.message);
    } else {
      this.terminal = "closed";
      this.stop();
      this.setStatus();
    }
  }
}
