# TaskDone

Personal daily-task PWA: add tasks, tick them off, watch the day fill up. Light gamification (XP, levels, streak, badges). Product decisions live in [`SPEC.md`](SPEC.md); engineering rules in [`CLAUDE.md`](CLAUDE.md).

## Requirements

- Node.js 20+ and npm

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

## Scripts

| Script              | What it does                               |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Dev server with hot reload                 |
| `npm run build`     | Typecheck and production build to `dist/`  |
| `npm run preview`   | Serve the production build (tests the PWA) |
| `npm run lint`      | ESLint                                     |
| `npm run typecheck` | TypeScript, strict mode                    |
| `npm test`          | Unit and component tests (Vitest + RTL)    |
| `npm run format`    | Prettier write                             |
| `npm run check`     | lint + typecheck + test (CI entry point)   |

## Project layout

```
src/
  app/            app shell, providers
  features/
    tasks/        task model, repository, hooks, list UI
    progress/     daily progress ring and calculations
    gamification/ XP, levels, streak, badges (pure logic + UI)
    auth/         email-link sign-in (milestone 5)
  lib/date.ts     local-day helpers (the single place for "what day is it")
  config/gamification.ts  every rule value (XP, level formula, badges)
  styles/         design tokens (CSS variables) and global styles
```

### Storage

Tasks and stats sit behind a `TaskStore` interface (`src/features/tasks/store.ts`). Until Firebase is wired in (milestone 5), the app uses a `localStorage` implementation, so it already works offline on a single device.

## Firebase setup (milestone 5)

1. Create a project at <https://console.firebase.google.com>.
2. Add a **Web app** and copy its config values.
3. **Firestore Database** → Create database (production mode).
4. **Authentication** → Sign-in method → enable **Email/Password** and its **Email link (passwordless sign-in)** option.
5. **Authentication** → Settings → **Authorized domains**: add the domains you serve from (`localhost` is there by default; add your hosting domain).
6. Copy `.env.example` to `.env.local` and fill in the values. Never commit `.env*` files (except `.env.example`).
7. Deploy the security rules: `npx firebase-tools deploy --only firestore:rules`.
