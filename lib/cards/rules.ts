/** Thrown by a game engine when an action breaks the rules; the message is shown to the player. */
export class RuleError extends Error {}

export function fail(message: string): never {
  throw new RuleError(message);
}
