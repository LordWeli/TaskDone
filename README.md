# TaskDone

Personal daily-task PWA: add tasks, tick them off, watch the day fill up. Light gamification (XP, levels, streak, badges). Product decisions live in [`SPEC.md`](SPEC.md); engineering rules in [`CLAUDE.md`](CLAUDE.md); out-of-scope ideas in [`IDEAS.md`](IDEAS.md).

Live: <https://taskdone-wsn.web.app> (installable: Safari **Share → Add to Home Screen** on iPhone,
or the install prompt in Chrome/Android).

## Requirements

- Node.js 20+ and npm. The toolchain is pinned to Vite 6, Vitest 3, jsdom 26 and ESLint 9 so it
  runs on Node 22.3; newer majors need Node 22.12+.

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
| `npm run test:e2e`  | Playwright smoke test, online and offline  |
| `npm run format`    | Prettier write                             |
| `npm run check`     | lint + typecheck + test                    |
| `npm run icons`     | Regenerate PNG icons in `public/icons/`    |
| `npm run deploy`    | Build, deploy hosting and Firestore rules  |

## Project layout

```
src/
  app/            App (local vs Firebase), FirebaseApp (auth gate, lazy chunk),
                  SyncedShell (Firestore, lazy chunk), Shell, Dashboard, feedback/
  features/
    tasks/        task model, repository, hooks, list UI
    progress/     daily progress ring and calculations
    gamification/ XP, levels, streak, badges (pure logic + UI)
    auth/         email + password sign-in
  lib/date.ts     local-day helpers (the single place for "what day is it")
  lib/firebase*.ts, firestore.ts  Firebase config, app/auth, Firestore with persistent cache
  config/gamification.ts  every rule value (XP, level formula, badges)
  styles/         design tokens (CSS variables) and global styles
```

### Storage and sync

Tasks and stats sit behind a `TaskStore` interface (`src/features/tasks/store.ts`):

- **Firestore** (`firestoreStore.ts`) when `.env.local` has the Firebase config. Data lives in
  `users/{uid}/tasks/{taskId}` and `users/{uid}/stats/summary`. Firestore's persistent IndexedDB
  cache serves reads offline and queues writes until the connection returns. Each action (a task
  change plus its stats) is one batched write, so XP never drifts.
- **localStorage** (`localStore.ts`) when no Firebase config is present: handy for local work and
  used by the tests.

Times are stored as milliseconds since epoch because day boundaries use the device's local clock.

Known limit: stats are computed on the device. If two devices complete tasks while both are
offline, the last stats write wins when they sync (tasks themselves are never lost). Fine for one
person; a server-side recount would be the fix if it ever matters.

## Testing

- **Unit and component** (`npm test`): gamification rules (XP, levels, streak, midnight and DST
  edges, undo, perfect day), task actions, stores, Firestore mapping, login and the dashboard
  flows. Tests run in the `America/New_York` zone so DST edges are deterministic.
- **End to end** (`npm run test:e2e`): add, complete and delete with undo, plus reload, against a
  production build served by the service worker, online and offline. It runs in local-storage
  mode, so it needs no Firebase account.
- **CI**: `.github/workflows/ci.yml` runs lint, typecheck, unit and e2e tests on every push and
  pull request. It does not deploy.

## Firebase setup

1. Create a project at <https://console.firebase.google.com> (Google Analytics not needed).
2. **Project settings → Your apps → Web (`</>`)**: register the app and copy its config.
3. **Build → Firestore Database → Create database**: pick the region closest to you
   (`southamerica-east1` for Brazil; it cannot be changed later), production mode. Backups need
   the paid plan and are not required.
4. **Build → Authentication → Sign-in method → Email/Password**: enable it. The email link option
   is not used (on iPhone a Home Screen app cannot receive links). Optional, once your account
   exists: **Authentication → Settings → User actions**, turn off _Enable create (sign-up)_ so no
   one else can create accounts.
5. **Authentication → Settings → Authorized domains**: `localhost` and
   `<project-id>.web.app` / `.firebaseapp.com` are there by default; add any custom domain.
6. Copy `.env.example` to `.env.local` and fill in the values. Never commit `.env*` files
   (except `.env.example`). The web config is not secret; the security rules protect the data.
7. Log in once: `npx firebase-tools@15 login`. The project id is set in `.firebaserc`.

## Deploy (Firebase Hosting)

```bash
npm run deploy        # build + deploy hosting and Firestore rules
npm run deploy:rules  # only firestore.rules
```

The app is served at `https://<project-id>.web.app`. `firebase.json` rewrites every path to
`index.html` and serves the service worker with `no-cache` so updates reach installed apps.
