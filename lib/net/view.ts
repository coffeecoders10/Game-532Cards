export interface SeatView {
  /** null when the seat is empty. */
  name: string | null;
  connected: boolean;
}

/**
 * What one player is allowed to see of a table. The host builds one per seat and sends it
 * encrypted to that seat only. `G` is the game's own per-seat projection.
 */
export interface TableViewOf<G> {
  /** Monotonic version so stale or replayed views are ignored. */
  v: number;
  code: string;
  you: number;
  seats: SeatView[];
  game: G | null;
  /** True while a seated player is away mid-game. */
  paused: boolean;
}
