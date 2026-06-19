# Sublime UI — Starter Template (`create-sublime-app` + `sublime init`)

**Sub-project #6.** The "zero-to-running-app" generator: scaffold a complete,
idiomatic Sublime app — shared core, per-platform screens, compiled navigation,
a sample model + theme, and the optional desktop shell — in one command.

> **Sequencing.** #6 is intentionally built **after** the GitHub-org move and the
> npm publish-readiness pass. The generated app pins **published** `@sublime-ui/*`
> ranges, so the packages must be on npm first for a scaffolded app to
> `npm install` and run for real. Org move is **done** (`sublime-ui/sublime-ui`);
> publish-readiness is the immediately-preceding task. This spec is captured now
> (design settled) and implemented once publish lands.

## 1. Goals

- A first-run experience matching every other modern framework: `npm create
  @sublime-ui/app@latest my-app` → answer a couple prompts → `npm install` → run.
- The generated app is the **"Your First App" docs walkthrough made real**: one
  vertical slice that exercises each subsystem once (model, theme, per-platform
  screen, navigation, native bridge) — a working reference, not a kitchen sink.
- The cross-platform pitch is the **default path**: targets are interactively
  selected with web/mobile/desktop all pre-checked, so pressing Enter yields the
  full web + mobile + desktop app.

Non-goals: multiple demo models / CRUD forms / component gallery (YAGNI — more to
delete than keep); a `sublime add <target>` retrofit command (deferred — the
generator writes all selected targets up front).

## 2. Delivery — two entry points, one core

```
create-app/                 # new published package: @sublime-ui/create-app — thin wrapper
  src/index.ts              # parse `npm create` argv → call devkit's initApp()
@sublime-ui/devkit
  src/commands/init.ts      # `sublime init [dir]` subcommand
  src/lib/scaffold/         # initApp() core: prompts → plan → write
    templates/              # template sources for each file/target
```

- **`npm create @sublime-ui/app my-app`** resolves to **`@sublime-ui/create-app`**
  (npm's `@scope/foo` → `@scope/create-foo` rule). It is a thin shim that imports
  and runs the same `initApp()` core that powers `sublime init`. Zero-install for
  new users.
- **`sublime init [dir]`** is the in-devkit subcommand for users who already have
  the CLI, and the unit under test. Both share `initApp(opts)` so behavior can't
  drift.

`initApp()` mirrors the existing generator conventions (`loadConfig`, `safeWrite`
with `force`/`FileExistsError`, structured `log`, integer exit codes). It refuses
to write into a non-empty target dir unless `--force`.

## 3. Prompts (interactive, non-interactive flags)

1. **App name** (defaults to the target dir's basename; validated as an npm name).
2. **Targets** — multi-select, all pre-checked:
   - `web` (Vite + MUI)
   - `mobile` (React Native + Paper)
   - `desktop` (Electron; wraps the web UI)
3. **Package manager** — detected from the invoking agent (`npm`/`pnpm`/`yarn`),
   confirmable.

Every prompt has a non-interactive flag for CI/scripted use: `--name`,
`--targets web,mobile,desktop`, `--pm npm`, `--force`, `--no-install`. With all
required flags present and `--yes`, the generator runs promptless.

## 4. What gets scaffolded (minimal vertical slice)

The canonical app layout (shared core + per-platform UI), pruned to the selected
targets:

```
my-app/
  package.json            # scripts: dev:web, dev:mobile, desktop:dev, build:nav, …
  sublime.config.json     # dirs + { desktop } block (only if desktop selected)
  tsconfig.json
  src/
    models/Task.ts        # SHARED — registerModel(Task), resource '/tasks'
    theme/tokens.{json,ts}# SHARED — defaultTokens copy + typed wrapper
    components/            # SHARED — (empty barrel; quartets land via make:component)
    native/greeter.service.ts   # SHARED contract — desktop only
    screens/
      web/   TaskList.tsx  TaskDetail.tsx          # if web/desktop
      mobile/TaskList.native.tsx TaskDetail.native.tsx  # if mobile
    navigation/
      storybook.web.ts     # sidebar: tasks → task (List → Detail)   # if web/desktop
      storybook.native.ts  # bottomNav/stack                          # if mobile
  web/      index.html, main.tsx (SublimeProvider + generated Navigation)  # if web
  mobile/   index.js, App.native.tsx                                       # if mobile
  desktop/  forge.config.ts, webpack.*.config.ts, src/main, src/renderer   # if desktop
  README.md               # the generated app's own getting-started
```

- **Task model** — `name:string`, `done:boolean`; `Task.rxAll()` drives the list.
- **TaskList → TaskDetail** — Detail reads a typed `{ id: number }` param, proving
  the typed-navigation path end to end.
- **greeter.service.ts** (desktop only) — `defineNative('greeter', { hello })`;
  the desktop renderer calls `useNative('greeter')` to show the bridge working,
  and returns `null` on web/mobile so the same screen is platform-agnostic.
- **Navigation is pre-compiled on first run**: post-scaffold the generator runs
  `build:nav` so the app is runnable immediately (generated artifacts are also
  git-ignored and regenerated by the `build:nav` script).

Desktop reuses the existing `@sublime-ui/desktop` scaffold templates
(`lib/desktop/templates.ts`); #6 composes them rather than duplicating.

## 5. Post-scaffold

1. Write files (atomic-ish: refuse non-empty dir up front).
2. `git init` + initial commit (skippable with `--no-git`).
3. `npm install` unless `--no-install`.
4. `build:nav` to generate navigation artifacts.
5. Print next steps: `cd my-app && npm run dev:web` (and mobile/desktop lines for
   selected targets).

## 6. Dependency versions

The generated `package.json` pins **published** ranges for the chosen targets:
`@sublime-ui/framework`, `@sublime-ui/library`, `@sublime-ui/ui`, and (desktop)
`@sublime-ui/desktop`, plus the peer runtimes each target needs (MUI/Vite for web,
RN/Paper for mobile, electron + forge for desktop). Ranges are sourced from a
single `versions.ts` constant in the generator so a release bump touches one file.

## 7. Testing

- **Unit** (`sublime init` core): prompt-less `initApp()` runs against a temp dir
  per target combination (web-only, mobile-only, web+desktop, all three); assert
  the exact file set, `package.json` scripts/deps, and `sublime.config.json` shape;
  assert `--force` / non-empty-dir / bad-name handling.
- **`create-sublime-app` shim**: argv → `initApp()` mapping (no network).
- **E2E** (post-publish): scaffold all-three into a temp dir, `npm install`,
  `typecheck`, `build:nav`, `build` — all green against the real published
  packages. This is the gate that proves the template and the published packages
  agree.

## 8. Publish-readiness (this package)

`@sublime-ui/create-app` and the devkit changes ship under the same publish pass.
`@sublime-ui/create-app` is **scoped + `publishConfig.access: public`** (so
`npm create @sublime-ui/app` resolves it) with its own `bin`; the template's
generated `package.json` is **not** published (it's emitted, not depended on).
See [[sublime-ui-ships-to-npm]] and [[github-org-move-before-publish]].
