# CLAUDE.md — TaskDone

Personal daily-task web app. Read `SPEC.md` first: it is the source of truth for product decisions. This file defines how to build it.

## Working agreement

- The owner (Wesley) defines functionality, flow, usage and interface. You do the engineering. Decide the technical details yourself; do not ask about things that have a conventional default.
- **Stay in scope.** Do not add features beyond `SPEC.md`. If you have an idea that is outside it, append it to `IDEAS.md` (title + one line of why) and mention it in your final summary. Never implement it.
- Ask the owner only about product/design decisions that change what the user sees (e.g. choosing the palette). Batch questions; do not ask one by one.
- Work in small commits with clear messages (conventional commits, English). Keep the app runnable at every commit.
- UI copy is English. Code, comments and commits are English. Talk to the owner in Brazilian Portuguese.

## Stack

- React 18+ with Vite and TypeScript (strict mode on)
- PWA via `vite-plugin-pwa` (installable, offline shell, precached assets)
- Firebase: Firestore (with persistent local cache for offline) + Authentication (email + password sign-in)
- Tests: Vitest + React Testing Library; one Playwright smoke test for the 3 acceptance flows
- Lint/format: ESLint + Prettier. Package manager: npm.
- Prefer few dependencies. Animation: CSS first; add a small library (e.g. `motion`) only if CSS cannot do it. Charting: a tiny SVG ring/bar built by hand is preferred over a charting library.

## Architecture

```
src/
  app/            app shell, providers, routing (login vs dashboard)
  features/
    tasks/        task model, hooks, add/complete/delete, list UI
    progress/     daily progress ring/bar and calculations
    gamification/ xp, levels, streak, badges (pure logic + UI)
    auth/         email + password sign-in
  lib/
    firebase.ts   init + Firestore with persistent cache
    date.ts       local-day helpers (single place for "what day is it")
  config/
    gamification.ts  XP values, level formula, badge definitions (single source)
  styles/         design tokens (CSS variables), global styles
```

- Keep gamification rules as **pure functions** in `features/gamification`, fully unit-tested (XP, level, streak boundaries, undo of completion, perfect-day bonus, timezone/midnight edges).
- All rule values live in `config/gamification.ts`. No magic numbers elsewhere.
- No business logic inside components; components render state from hooks.

## Data model (Firestore)

- `users/{uid}/tasks/{taskId}`: `title`, `createdAt`, `completedAt|null`, `xpAwarded` (number, 0 when open)
- `users/{uid}/stats/summary`: `totalXp`, `level`, `currentStreak`, `longestStreak`, `lastActiveDay` (YYYY-MM-DD local), `badges` (map of badge id to unlock timestamp)
- Completing/uncompleting a task and updating stats happen in **one batched write or transaction** so XP never drifts.
- Use optimistic UI; the Firestore persistent cache handles offline writes and later sync.

## Security rules

- Write `firestore.rules`: a user can read/write only `users/{uid}/**` where `request.auth.uid == uid`. Everything else denied.
- Validate fields (title is a string, 1–200 chars; numeric fields are numbers) in the rules.
- Never commit secrets. The Firebase web config is not secret, but keep it in `.env` files with an `.env.example` committed. Do not commit `.env`.
- Add an `.env.example` and document the Firebase setup steps in `README.md` (create project, enable Firestore, enable email/password auth, authorized domains, deploy rules).

## Design direction

- Mobile first, light theme only (v1), warm and lively, clean cards in the spirit of Apple Notes / Google Keep.
- The **add-task input is the visual hero**: largest, most inviting element, always visible, thumb-reachable on mobile.
- Before locking the design, present the owner **2–3 palette + font pairings** with a real preview of the dashboard and wait for the choice. Then encode the choice as CSS variables (tokens), never hard-coded colors.
- Animations: purposeful and fast (about 150–300 ms). Completing a task, adding, deleting, XP gain, level up, perfect day. Respect `prefers-reduced-motion`. Animate `transform`/`opacity` only.

## Skills to use

Use these skills (installed locally in `~/.claude/skills` or via plugins). Check with `/skills` and tell the owner if any is missing instead of silently skipping it.

1. `brainstorming` — only if requirements are unclear after reading `SPEC.md`
2. `web-design-engineer` — base for building the UI
3. `better-layout`, `better-typography`, `better-colors` — structure, type scale, palette and contrast tokens
4. `better-writing` — every label, empty state, error and toast
5. `better-ui`, `emil-design-eng`, `animate` — polish and motion
6. `landing-page-design` and `build-awwwards-quality-sites` — **do not use** for this app (it is a tool, not a marketing site), except `landing-page-design` rules on spacing/radius/type if helpful

Before declaring any milestone done, run the review skills and **apply the fixes**: `better-accessibility`, `better-interface`, `interface-review`.

## Accessibility checklist (WCAG 2.2 AA)

- Everything usable by keyboard with visible focus; Enter adds a task, Space toggles
- Real `<button>`, `<input type="checkbox">`, `<label>`; accessible names on icon buttons
- Contrast: text 4.5:1, UI components 3:1 (verify with `better-colors`)
- Live region announces added/completed/deleted/undo and level-up/badge events
- Touch targets at least 44×44 px; zoom to 200% without breaking layout
- Reduced motion respected; never rely on color alone for state

## Milestones

1. **Scaffold:** Vite + React + TS, lint/test setup, PWA config, tokens, CI-ready scripts, README
2. **Local core (no Firebase yet):** add/complete/delete + undo, daily progress ring, list UI, with tasks behind a repository interface (in-memory/local implementation)
3. **Gamification:** pure logic + tests, then UI (XP bar, level, streak, badges, celebrations)
4. **Design pass:** present palette/font options, apply the chosen one, animations
5. **Firebase:** Firestore with persistent cache, email/password auth, security rules, swap the repository implementation, offline/sync test
6. **PWA + hardening:** installability (manifest, icons, offline), Lighthouse PWA/performance/accessibility pass, Playwright smoke test
7. **Review:** run the review skills, fix, update README, deploy instructions

At the end of each milestone: run lint, typecheck, tests; summarize in 3–5 lines what changed and what the owner should look at.

## Definition of done

- The 3 acceptance flows pass (add, complete, delete with undo), online and offline
- Same data appears on a second logged-in device
- Installable as PWA; Lighthouse accessibility ≥ 95
- `npm run lint`, `npm run typecheck` and `npm test` are green
- `IDEAS.md` lists anything out of scope that came up
