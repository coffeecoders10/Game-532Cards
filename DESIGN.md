# CC Card Games: Design Guide

The visual and interaction language for every game in the hub. Each game plays differently, but they should all feel like the same place: **a card table under a warm lamp, late evening, with friends.** When a new game needs a UI decision, check this document first; when it needs something this document doesn't cover, add it here.

Source of truth for values is [app/globals.css](app/globals.css). This document explains the intent behind them.

---

## 1. Product

**What it is.** A hub of playing-card games, played online with friends. Pick a game, open a table, share a six-character code (or link), play.

**Who it's for.** Small groups of friends, mostly on phones, often in the same room or on a call. Sessions are casual and social.

**Principles**

1. **Warm, not flashy.** It should feel like a real card table: felt, brass, paper, a leather rail. No neon, no gradients-for-gradients'-sake, no casino glitz.
2. **The cards are the interface.** Cards are big, readable and tactile. Chrome stays quiet so the table does the talking.
3. **Phone first.** Every screen works one-handed at 360px wide, then grows. Tap targets are at least 44px.
4. **Friends, not accounts.** A name and a code are the whole onboarding. Never block play behind sign-up.
5. **Consistent front door, bespoke table.** Landing pages, buttons, dialogs and status screens are shared and identical in feel. The table itself may add whatever each game needs, but stays on the same felt, with the same cards and the same tokens.

**Voice.** Friendly, short, a little playful, table-talk rather than software-talk: "Open a table", "Pulling up a chair…", "Who's sitting down?", "Back to the table". No exclamation-mark enthusiasm, no jargon, no blame in errors ("That isn't a table code", not "Invalid input").

---

## 2. Visual language

### 2.1 Colour

All colours are CSS custom properties on `:root`. Use the tokens, never raw hex, in game code.

| Token | Value | Use |
| --- | --- | --- |
| `--felt-hi` | `#1b5a50` | Centre of the table cloth (lit) |
| `--felt-mid` | `#124038` | Mid cloth |
| `--felt-lo` | `#081f1e` | Edge of the cloth; page background fallback |
| `--rail` / `--rail-hi` | `#3a161c` / `#5f2a31` | Leather rail around a table (oxblood) |
| `--brass` | `#dcb064` | Accent: tokens, eyebrow text, borders on hover |
| `--brass-dim` | `#8f7240` | Muted brass |
| `--lamp` | `#ffdc94` | Primary action fill, headline highlight, focus ring |
| `--paper` / `--paper-edge` | `#f8f2e3` / `#e1d5b6` | Card faces, secondary buttons |
| `--ink` | `#1b2130` | Text on paper, black suits |
| `--red` | `#c4372c` | Red suits |
| `--text` | `#f4ecd8` | Primary text on felt (warm off-white) |
| `--text-dim` | `#aebcb2` | Secondary text on felt |
| `--panel` | `rgba(8, 28, 27, 0.78)` | Frosted panel fill |
| `--panel-line` | `rgba(220, 176, 100, 0.28)` | Hairline borders, dividers |
| `--good` / `--warn` | `#7fd19b` / `#f0a15e` | Positive and cautionary feedback |

**Rules**

- Felt green is the world; brass/lamp is the single accent. Do not introduce a second accent colour. A game that needs to tell things apart (players, teams) uses card suits, shapes or labels first, and brass/paper/felt tints second.
- Text on felt uses `--text` or `--text-dim`. Text on paper or lamp uses `--ink` or `#2b1d0a` (dark brass-brown).
- Pure white and pure black are never used for surfaces or text.
- Keep contrast at WCAG AA or better. `--text-dim` on `--felt-mid` passes for body-size text; don't go dimmer.

### 2.2 Typography

| Role | Font | Variable | Use |
| --- | --- | --- | --- |
| Display | **Young Serif** (400) | `--font-head` | Titles, big numerals, brass token glyphs, table codes |
| UI | **Figtree** | `--font-body` | Everything else |

- Display type is used sparingly: page titles, game names, big numbers, the join code. Never for paragraphs or buttons.
- Buttons and key labels are Figtree **800**. Body is 400, small labels 600.
- Body 16px/1.45. Page titles use `clamp()` so they scale from phone to desktop (hub title: `clamp(40px, 9vw, 64px)`).
- Small uppercase labels (eyebrows) are 13px, 800, `letter-spacing: 0.22em`, in `--brass`.

### 2.3 Surfaces and depth

- **Felt page**: layered radial gradients, a lamp glow (`rgba(255, 220, 148, 0.16)`) high and centred, felt-hi in the middle fading to felt-lo. Component: `FeltPage`.
- **Panel**: `--panel` fill, 1px `--panel-line` border, 24px radius, `0 24px 60px rgba(0,0,0,.5)` shadow, 10px backdrop blur. Component: `Panel`. Tiles on the hub use the same recipe.
- **In-game table**: adds a soft cloth grain (SVG noise, `soft-light`) and a **leather rail** drawn as inset box-shadows in `--rail` / `--rail-hi`. See `Table.module.css` for the reference.
- **Radii**: 24px panels and tiles, 22px dialogs, 14px buttons, 12px inputs, 999px chips and pills, 7% of card width on cards.
- **Scrollbars** are global and inconspicuous: thin, transparent track, faint brass thumb (`rgba(220, 176, 100, 0.28)`, brighter on hover). Defined once in `globals.css`; don't restyle per component.
- Shadows are warm-black and soft, with a small tight shadow underneath to sit things on the cloth. No coloured glows except the lamp.

### 2.4 Cards

`PlayingCard` is shared by every game and is the visual anchor.

- Ratio **5:7**. Size by setting `--cw` on the card or any ancestor; everything inside scales with it.
- Paper face with ink/red pips and corner indices; a crest back for face-down cards.
- Supports ranks **2 to Ace** and all four suits. Games that use a partial deck simply don't deal the others.
- Props for state: `disabled` (can't play now), `selected`, `fresh` (just received), `trump`, `faceDown`.
- Render as a `<button>` when interactive (pass `onClick`), a labelled `role="img"` otherwise. Every card has an accessible name ("Queen of Hearts").
- Fans: cards overlap by ~42% of their width, rotate 7° per step from centre and drop on a parabola (`translate: 0 calc(var(--d) * var(--d) * 3px)`).

### 2.5 Brass tokens

`BrassToken` is a round brass disc with a serif glyph, the hub's recurring "game piece". Use it for game emblems (5-3-2 is three tokens), score markers and target chips. Size via `--token`. Tokens sit slightly rotated and uneven, as if dropped on the table.

### 2.6 Iconography

Minimal. Suits are inline SVG (`SuitIcon`). Prefer words ("Rules", "Leave") over icon-only buttons; where an icon-only control is unavoidable it needs an `aria-label` and a 44px target.

---

## 3. Motion

Motion should feel like cards being handled: quick, springy, physical.

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default: entrances, hover, layout |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Things dropped on the table (tokens, titles) |

- Entrances: **deal in** (cards fly in from above, staggered ~90ms) and **drop** (tokens/titles fall and settle, ~0.8s). Content panels **rise** (20px, ~0.6s).
- Hover on interactive surfaces: lift 2–4px. Press: sink 3px and lose the bottom shadow, like pressing a physical key.
- Durations: 150–280ms for feedback, 600–800ms for scene-setting entrances. Nothing blocks input.
- Animate `transform`-family properties (`translate`, `rotate`, `scale`) and `opacity` only.
- **Always honour `prefers-reduced-motion`.** The global rule in `globals.css` collapses durations; don't add motion that depends on it to convey information.

---

## 4. Layout and responsive behaviour

- **Mobile first**, 360px baseline. Use `100dvh`, not `100vh`, and respect `env(safe-area-inset-*)` (the viewport is `viewport-fit: cover`).
- Page gutters 20px. Content max-widths: panels 380px, hub grid 980px, dialogs 520px.
- **Game landing**: single column on phones (hero, then panel); at 900px+ two columns (hero 520px | panel 380px) centred with a fluid gap.
- **Hub fold**: the first row of game tiles must be visible without scrolling on a typical laptop and on phones. The hero is compact (logo and name inline, ≤64px title); on wide screens the words sit beside the card fan, on phones the fan stacks under them at a smaller size. The fan is never hidden.
- **Hub grid**: `repeat(auto-fit, minmax(min(100%, 300px), 1fr))`. New games flow in automatically.
- **In-game table** fills the viewport (`100dvh`, no page scroll), with a header row, a flexible board and the player's hand along the bottom. The hand stays within thumb reach.
- No horizontal page scroll at any width.

---

## 5. Screens every game has

Each game ships the same set of screens, built from shared components, so a player who knows one knows them all.

| Screen | Route | Built from |
| --- | --- | --- |
| **Hub** | `/` | `Hub`, `GameTile` (data from `games/registry.tsx`) |
| **Game landing** | `/games/<slug>` | `GameLanding` + `Panel`, `TextField`, `Button`, `Divider` |
| **Table / room** | `/games/<slug>/room/[code]` | Game-specific, on the shared felt + cards |
| **Rules** | modal on the table | `RulesDialog` |
| **Status / error** | any | `StatusScreen` |

### Landing page anatomy

1. Quiet "‹ All games" back link, top left.
2. **Emblem** (the game's brass-token mark, dropping in), **tagline** (one sentence, ≤ 28ch), optional **card fan** showing something characteristic of the game's deck.
3. **Panel** with: name field (remembered between visits), a primary "Open a table" button, a `Divider` ("or join friends"), a code field plus secondary "Join".

### Table header

Left: wordmark in display type, `--lamp`. Middle: game state (round, trump...). Right: **Rules** and **Leave** as small pill buttons; "Leave" asks to confirm by changing its label to "Leave table?" for 3 seconds rather than opening a modal.

### Branding

The CoffeeCoders logo (`public/coffeecoders_logo.png`, white line-art with a transparent background, made for dark surfaces) appears at the top of the hub, and a quiet `Watermark` ("Built by CoffeeCoders", 60% opacity, full on hover) closes the hub and every game landing page. It is deliberately absent from the in-game table, where nothing should compete with the cards.

### Status screens

Centre-aligned on the felt: optional shuffling-cards animation while busy, a display-type title, one dim sentence of explanation, and at most one button. Always give a way out.

---

## 6. Component inventory

Shared, game-agnostic building blocks. Use these before writing new CSS.

| Component | Path | Purpose |
| --- | --- | --- |
| `PlayingCard`, `SuitIcon` | `components/cards/` | Cards and suit glyphs |
| `FeltPage` | `components/ui/` | Full-height felt background for any top-level page |
| `Panel` | `components/ui/` | Frosted container for forms and content |
| `Button`, `ButtonLink` | `components/ui/` | Primary (lamp) and secondary (paper) call-to-action |
| `TextField` | `components/ui/` | Labelled input; `variant="code"` for join codes |
| `Divider` | `components/ui/` | Hairline with centred label |
| `BrassToken` | `components/ui/` | Round brass emblem/marker |
| `Watermark` | `components/ui/` | "Built by CoffeeCoders" credit with logo, linking to coffeecoders.cc |
| `BackLink` | `components/ui/` | Quiet "‹ label" link up one level |
| `GameLanding` | `components/ui/` | The shared game front door layout |
| `RulesDialog` | `components/ui/` | Native `<dialog>` rules sheet; game supplies title and an `<ol>` |
| `StatusScreen` | `components/ui/` | Full-screen message with optional back button |
| `Hub`, `GameTile` | `components/hub/` | Landing page and per-game tiles |

Shared logic lives in `lib/`: `lib/cards/cards.ts` (suits, ranks, names, shuffle, sort) and `lib/hooks/useClientValue.ts` (hydration-safe browser values).

---

## 7. Accessibility

- Visible focus on everything interactive: 3px `--lamp` outline, 3px offset (global `:focus-visible`).
- Tap targets ≥ 44px. Inputs and primary buttons are 50px tall.
- Cards and emblems have text alternatives; decorative flourishes (`fan`, dividers, chevrons) are `aria-hidden`.
- Use real elements: `<button>` for actions, `<a>`/`Link` for navigation, `<dialog>` for modals (focus trapping and Esc come free), `<label>` on every input.
- Never rely on colour alone: red/black suits also differ by shape; turn/state is also conveyed in text.
- Respect `prefers-reduced-motion` (see §3).

---

## 8. Adding a new game: checklist

1. **Code** goes under `games/<slug>/`: `components/`, `game/` (pure rules, no React, no networking), and `net/` if it's multiplayer. Keep rules deterministic and testable.
2. **Routes** under `app/games/<slug>/`: `page.tsx` (landing) and `room/[code]/page.tsx` for multiplayer tables. Set `metadata.title` to the game name (the site adds the " · CC Card Games" suffix).
3. **Landing** is `GameLanding` with the game's emblem, a one-sentence tagline, and a fan of characteristic cards. Name field first, "Open a table" primary, join by code secondary.
4. **Emblem**: build a small `Emblem<Name>` from `BrassToken`s or similar that accepts a `size` and an `animated` flag. Use the same component on the landing page and the hub tile.
5. **Register** the game in `games/registry.tsx` (slug, title, tagline, facts, emblem). The hub picks it up automatically.
6. **Rules**: write a short `<ol>` and show it through `RulesDialog`. Lead each item with a bold phrase.
7. **Table**: sit on felt (same gradients, grain and rail as the 5-3-2 table), use `PlayingCard` for every card, keep the header pattern (§5) and the Leave-confirm behaviour.
8. **Storage and rooms** are namespaced by game: `"<slug>cards:..."` for storage keys, `roomIdFor` prefixes for socket rooms, because the socket service is shared with other projects.
9. **Don't fork shared components.** If one almost fits, extend it with a prop (and update §6) rather than copying it.
10. **Check**: works at 360px, no horizontal scroll, keyboard-reachable, reduced motion respected, copy follows §1's voice.

---

## 9. Not yet defined

Things the first game hasn't needed. Decide and record them here when a game does:

- Spectator and rejoin states in the lobby
- Scoreboards and end-of-game summaries as a shared component
- Games for 2 or 4+ players (seat layouts around the table)
- Single-player or bot opponents
- Sound and haptics
- Light theme (the product is deliberately dark-felt only for now)
