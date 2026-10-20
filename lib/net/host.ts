import type { RandomInt } from "../game/cards";
import {
  type Game,
  RuleError,
  chooseTrump,
  collectTrick,
  giveCard,
  markReady,
  newGame,
  playCard,
} from "../game/engine";
import { type TableView, gameViewFor } from "../game/view";
import {
  type Identity,
  deriveSharedKey,
  open,
  samePublicKey,
  seal,
  secureRandomInt,
} from "./crypto";
import { cleanName, uniqueName } from "./names";
import { type Action, type ToGuest, type Wire, parseToHost } from "./protocol";
import type { RoomConnector, RoomLink } from "./room";
import { clearTable, loadSnapshot, saveSnapshot } from "./storage";

/** How long a finished hand stays on the table before it is swept to the winner. */
export const TRICK_PAUSE_MS = 2300;

interface SeatRecord {
  id: string | null;
  name: string | null;
  pk: JsonWebKey | null;
  key: CryptoKey | null;
}

interface Snapshot {
  v: number;
  game: Game | null;
  seats: { id: string | null; name: string | null; pk: JsonWebKey | null }[];
}

export interface HostCallbacks {
  onView(view: TableView): void;
  onConnection(online: boolean): void;
  onNotice(message: string): void;
}

export interface HostOptions {
  code: string;
  identity: Identity;
  name: string;
  connect: RoomConnector;
  callbacks: HostCallbacks;
  randomInt?: RandomInt;
  /** Save the table to sessionStorage so a page refresh can resume it. */
  persist?: boolean;
}

const emptySeat = (): SeatRecord => ({ id: null, name: null, pk: null, key: null });

/**
 * The host's browser is the game server. It owns the only copy of the full game state,
 * validates every action with the engine, and sends each player only their own view,
 * sealed so that nobody else in the shared room can read it.
 */
export class HostSession {
  private readonly seats: SeatRecord[] = [emptySeat(), emptySeat(), emptySeat()];
  private game: Game | null = null;
  private v = 0;
  private present = new Set<string>();
  private link: RoomLink | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private readonly randomInt: RandomInt;

  constructor(private readonly opts: HostOptions) {
    this.randomInt = opts.randomInt ?? secureRandomInt;
    this.seats[0] = {
      id: opts.identity.id,
      name: cleanName(opts.name),
      pk: opts.identity.pub,
      key: null,
    };
    this.restore();
  }

  start() {
    this.link = this.opts.connect({
      onConnect: () => {
        this.opts.callbacks.onConnection(true);
        this.announce();
        this.publish();
      },
      onDisconnect: () => this.opts.callbacks.onConnection(false),
      onStatus: (users) => this.handleStatus(users),
      onWire: (wire) => void this.handleWire(wire),
    });
  }

  /** Drops the connection but keeps the table, so a refresh can resume it. */
  stop() {
    this.stopped = true;
    this.clearTimer();
    this.link?.close();
    this.link = null;
  }

  /** Ends the table for everyone. */
  async close() {
    const sends = this.seats.map((s, i) => (i > 0 && s.id ? this.sendTo(i, { k: "closed" }) : null));
    await Promise.all(sends);
    clearTable(this.opts.code);
    this.stop();
  }

  /** The host's own moves go through the same validation path as everyone else's. */
  act(action: Action) {
    this.handleAction(0, action);
  }

  // ------------------------------------------------------------ persistence

  private restore() {
    if (!this.opts.persist) return;
    const saved = loadSnapshot(this.opts.code) as Snapshot | null;
    if (!saved || saved.seats?.[0]?.id !== this.opts.identity.id) return;
    this.v = saved.v;
    this.game = saved.game;
    saved.seats.forEach((s, i) => {
      if (i > 0) this.seats[i] = { id: s.id, name: s.name, pk: s.pk, key: null };
    });
  }

  private persist() {
    if (!this.opts.persist) return;
    const snapshot: Snapshot = {
      v: this.v,
      game: this.game,
      seats: this.seats.map(({ id, name, pk }) => ({ id, name, pk })),
    };
    saveSnapshot(this.opts.code, snapshot);
  }

  // ------------------------------------------------------------------ state

  private isConnected(seat: number): boolean {
    const id = this.seats[seat].id;
    return id !== null && (seat === 0 || this.present.has(id));
  }

  private get paused(): boolean {
    return this.game !== null && this.seats.some((_, i) => !this.isConnected(i));
  }

  private viewFor(seat: number): TableView {
    return {
      v: this.v,
      code: this.opts.code,
      you: seat,
      seats: this.seats.map((s, i) => ({ name: s.name, connected: this.isConnected(i) })),
      game: this.game ? gameViewFor(this.game, seat) : null,
      paused: this.paused,
    };
  }

  /** Sends every connected player their own view and arms any automatic step. */
  private publish() {
    if (this.stopped) return;
    this.v += 1;
    this.persist();
    this.opts.callbacks.onView(this.viewFor(0));
    for (let seat = 1; seat < this.seats.length; seat++) {
      if (this.seats[seat].id && this.isConnected(seat)) {
        void this.sendTo(seat, { k: "view", view: this.viewFor(seat) });
      }
    }
    this.scheduleAuto();
  }

  private scheduleAuto() {
    if (this.timer || !this.game || this.game.step !== "trickDone" || this.paused) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.stopped || !this.game || this.game.step !== "trickDone" || this.paused) return;
      this.game = collectTrick(this.game);
      this.publish();
    }, TRICK_PAUSE_MS);
  }

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  // ---------------------------------------------------------------- sending

  private announce() {
    const { identity } = this.opts;
    this.link?.send({ t: "host", id: identity.id, pk: identity.pub });
  }

  private async keyFor(seat: number): Promise<CryptoKey | null> {
    const rec = this.seats[seat];
    if (!rec.pk) return null;
    rec.key ??= await deriveSharedKey(this.opts.identity.priv, rec.pk);
    return rec.key;
  }

  private async sendTo(seat: number, payload: ToGuest) {
    const to = this.seats[seat].id;
    const key = await this.keyFor(seat);
    if (!to || !key || !this.link) return;
    const box = await seal(key, payload);
    this.link?.send({ t: "box", from: this.opts.identity.id, to, ...box });
  }

  private notify(seat: number, message: string) {
    if (seat === 0) this.opts.callbacks.onNotice(message);
    else void this.sendTo(seat, { k: "error", message });
  }

  // --------------------------------------------------------------- receiving

  private handleStatus(users: string[]) {
    const next = new Set(users);
    const changed = next.size !== this.present.size || users.some((u) => !this.present.has(u));
    this.present = next;
    if (!this.game) {
      // Before the game starts a vanished guest simply gives up their seat.
      for (let i = 1; i < this.seats.length; i++) {
        const id = this.seats[i].id;
        if (id && !next.has(id)) this.seats[i] = emptySeat();
      }
    }
    if (changed) this.publish();
  }

  private async handleWire(wire: Wire) {
    if (wire.t === "hello") this.handleHello(wire);
    else if (wire.t === "box" && wire.to === this.opts.identity.id) await this.handleBox(wire);
  }

  private handleHello(hello: Extract<Wire, { t: "hello" }>) {
    const { identity } = this.opts;
    if (hello.id === identity.id) return;
    const known = this.seats.findIndex((s) => s.id === hello.id);
    if (known >= 0) {
      // A returning player must hold the same key, otherwise anyone could claim their seat.
      const pk = this.seats[known].pk;
      if (!pk || !samePublicKey(pk, hello.pk)) return;
    } else {
      let slot = this.seats.findIndex((s, i) => i > 0 && s.id === null);
      // Mid-game, a newcomer may take over a seat whose player has dropped (e.g. a lost tab).
      if (slot < 0 && this.game) slot = this.seats.findIndex((_, i) => i > 0 && !this.isConnected(i));
      if (slot < 0) {
        this.link?.send({ t: "full", to: hello.id });
        return;
      }
      const others = this.seats.filter((_, i) => i !== slot).map((s) => s.name);
      this.seats[slot] = {
        id: hello.id,
        name: uniqueName(cleanName(hello.name), others),
        pk: hello.pk,
        key: null,
      };
    }
    this.present.add(hello.id);
    this.link?.send({ t: "host", id: identity.id, pk: identity.pub, to: hello.id });
    this.publish();
  }

  private async handleBox(box: Extract<Wire, { t: "box" }>) {
    const seat = this.seats.findIndex((s, i) => i > 0 && s.id === box.from);
    if (seat < 0) return;
    const key = await this.keyFor(seat);
    if (!key) return;
    const message = parseToHost(await open(key, box));
    // A forged sender fails to decrypt; a replayed action is harmless because the engine re-validates it.
    if (message && this.seats[seat].id === box.from) this.handleAction(seat, message.action);
  }

  // ---------------------------------------------------------------- actions

  private handleAction(seat: number, action: Action) {
    try {
      this.apply(seat, action);
    } catch (error) {
      if (error instanceof RuleError) this.notify(seat, error.message);
      else throw error;
    }
  }

  private apply(seat: number, action: Action) {
    if (action.type === "leave") {
      this.leave(seat);
      return;
    }
    if (action.type === "sync") {
      if (seat !== 0) void this.sendTo(seat, { k: "view", view: this.viewFor(seat) });
      return;
    }
    if (action.type === "start") {
      if (seat !== 0) throw new RuleError("Only the host can start the game.");
      if (this.game) throw new RuleError("The game has already started.");
      if (!this.seats.every((_, i) => this.isConnected(i))) throw new RuleError("Three players are needed.");
      this.game = newGame(this.randomInt);
      this.publish();
      return;
    }
    if (!this.game) throw new RuleError("The game hasn't started.");
    if (this.paused) throw new RuleError("Waiting for a player to come back.");

    switch (action.type) {
      case "trump":
        this.game = chooseTrump(this.game, seat, action.suit, this.randomInt);
        break;
      case "give":
        this.game = giveCard(this.game, seat, action.card, this.randomInt);
        break;
      case "play":
        this.game = playCard(this.game, seat, action.card);
        break;
      case "ready":
        this.game = markReady(this.game, seat, this.randomInt);
        break;
    }
    this.publish();
  }

  private leave(seat: number) {
    if (seat === 0) return; // the host ends the table with close()
    const { name } = this.seats[seat];
    // Mid-game the seat keeps its name so the table can pause and wait for a replacement.
    this.seats[seat] = this.game ? { id: null, name, pk: null, key: null } : emptySeat();
    this.publish();
  }
}
