# Limyrx Client

A modern, feature-rich Minecraft launcher and game client built with Electron and Vue 3.

Limyrx Client is a curated, manifest-driven Minecraft client and launcher platform. It manages game
instances, mod loaders, modpacks, resource packs, shader packs, worlds and accounts — everything you
need to play and mod Minecraft, in one fast, modern application.

[![Limyrx Client](https://img.shields.io/badge/Download-Latest-blue?style=flat-square)](https://client.limyrx.online)

## Links

- [Official Website](https://client.limyrx.online)
- [GitHub](https://github.com/ILMaRkz-Y/Limyrx-Client)
- [Discord](https://discord.gg/FKVSvjU2tc)

## Features

### Game management

- **Instance management** — create, duplicate, delete, group and organize multiple game instances,
  with full per-instance file management and icons.
- **All major mod loaders** — Forge, Fabric, Quilt, NeoForge, LiteLoader, OptiFine and LabyMod,
  with smart, diagnose-first installers.
- **Modpacks** — import and export CurseForge, Modrinth (`.mrpack`), MultiMC and MCBBS packs; download
  modpacks directly from the Store.
- **Automatic game updates** — install any Minecraft version, keep instances up to date, and update
  modded content from upstream pack sources.
- **Content managers** — dedicated managers for mods, resource packs, shader packs, worlds/saves,
  screenshots and blueprints/schematics, each with enable/disable, metadata, hashing and preview.
- **Per-instance settings** — resolution, JVM arguments, Java, launch commands, appearance, server
  files and per-instance theme support.
- **Java management** — automatic Java discovery (system paths, Zulu, official manifest), JVM
  architecture detection, and auto-install of a default Java runtime.

### Marketplace & content

- **Store** — browse, search and install from **Modrinth**, **CurseForge** and **Feed the Beast**,
  with filters for game versions, mod loaders and categories.
- **Mod metadata database** — a SQLite-backed lookup (SHA-1 → metadata) that maps mods across
  Modrinth, CurseForge, Forge and Fabric.
- **Project ID mapping** — Modrinth ↔ CurseForge project matching powered by a local SQLite index.
- **Blueprint markets** — browse schematics from mcschematic.top, CreativeMechanicServer.com and
  minecraft-schematics.com.
- **Collections** — launcher-owned mod collections with schema-validated, atomic JSON persistence.

### Accounts

- **Microsoft** account login via OAuth (MSAL) with secure token storage.
- **Yggdrasil** (third-party) account servers via Authlib Injector.
- **Ely.by** and **LittleSkin** integration for skin servers.
- **Offline mode** accounts.
- Skin viewing and editing, Mojang friends list, name change support, and an in-app local
  Yggdrasil-compatible server that serves skins/capes/elytra.

### Limyrx Client platform

- **Curated client content** — the flagship Limyrx feature: a `LimyrxClientService` that delivers a
  curated, Forge-based client whose mods and settings come from a hosted manifest
  (`limyrx-client/manifest.json`, served via jsDelivr CDN with a raw.githubusercontent fallback)
  instead of being hand-picked per user.
- **Verified delivery** — every file downloaded into an instance is **SHA-1 verified** before it is
  written, with typed errors for invalid/fetch/version/checksum failures.

### Networking & multiplayer

- **WebRTC multiplayer** — play together over peer-to-peer connections (`node-datachannel`, STUN and
  NAT port mapping), with friends, instance sharing and a dedicated multiplayer window.
- **Server status** — ping servers to check online status, player counts and protocol/version
  compatibility; LAN server discovery included.
- **Adaptive downloader** — multi-mirror downloads with EWMA host reputation, optimal-stopping
  aborts and a CDN circuit breaker; GFW-aware mirror switching (BMCL mirrors, npmmirror).
- **Instance sharing & export** — export instances as a server via ServerFS/SSH, zip-based instance
  updates, and share instances between users.

### Customization & UX

- **Themes** — launcher themes as zip bundles, a single custom `theme.css` overlay, per-instance
  themes and desktop-wallpaper integration.
- **3D visuals** — animated backgrounds (vanta), particle/halo/dawn GLSL effects, 3D player skin
  previews (skinview3d) and block/blueprint rendering (three.js).
- **Command palette** — Ctrl+K-style command palette for quick navigation.
- **In-app AI assistant** — an integrated AI agent chat that can navigate the launcher and help you.
- **First-run tutorial** — an interactive walkthrough built with driver.js.
- **Gamepad / Steam Deck support** — navigate the launcher with a controller.
- **Playtime tracking** — per-account/instance playtime and last-played records.
- **Splash video, audio player and typing effects** — polish throughout the UI.
- **Discord Rich Presence** — show what you are playing in your Discord status.

### Platform support & integration

- **Windows, macOS and Linux** — installers for zip/AppX (Windows), dmg (macOS), and
  deb/rpm/AppImage/tar.xz/pacman/snap (Linux).
- **Microsoft Store** distribution (AppX / MSIX).
- **Bedrock Edition (Windows)** — detect and launch the UWP Bedrock client.
- **Protocols** — OS-registered `limyrx://` scheme plus in-app `xmcl://` protocol and an internal
  HTTP server, enabling deep links and CLI integration.
- **GPU optimization** — on Windows, assigns the Java JVM to the high-performance GPU when a
  dedicated GPU is present; on Linux, sets `DRI_PRIME` / `__NV_PRIME_RENDER_OFFLOAD` for hybrid-GPU
  machines.
- **Save editing** — read world metadata (NBT/level.dat), preview world maps and edit regions
  (delete/copy/paste chunks).
- **Automatic updates** — self-hosted update feed with GitHub-releases fallback, asar-only hot
  updates, AppX and manual update channels, plus a GFW mirror path via `@xmcl/app-*` npm packages.
- **CLI** — headless commands for instances, users and resources (`--no-window`, `--json`, `--root`, …).

### Engineering & reliability

- **29 locales** — ar, bn, de, en, es-ES, fr, gl, hi, hu, id, it-IT, ja-JP, ko, kz, nl, pl, pt-BR,
  ru, sa, ta, tr, uk, vi, zh-CN, zh-HK, zh-TW, and more (with `en` as the fallback).
- **Telemetry** — optional Application Insights telemetry.
- **Diagnostics** — crash reports, task monitors, log viewers and an encoding worker for non-UTF-8
  logs.
- **Feature flags & flights** — runtime toggles (e.g. `safeStorageEncryption`) for safe rollouts.

## Architecture

Limyrx Client is a pnpm monorepo (`pnpm@11.10.0`, Node `>=22.16.0`). The application is split into
two processes — an Electron **main** process and a Vue 3 **renderer** — that talk over a typed,
schema-validated service layer.

| Package/Directory | Description |
|---|---|
| `limyrx-electron-app` | The Electron shell (`limyrx`, Electron 43): main-process entry, window controllers, updater, tray, protocols, esbuild bundling and electron-builder configs. |
| `limyrx-keystone-ui` | The Vue 3 renderer UI (`@xmcl/keystone-ui`): Vuetify 4 + vue-i18n + vue-router, three.js/skinview3d visuals, driver.js tutorial, AI agent and command palette. |
| `xmcl-runtime` | The main-process runtime (`@xmcl/runtime`): ~40 backend services for launching, installing, users, marketplace, themes, multiplayer, saves, telemetry, SQLite persistence and shortcuts. |
| `xmcl-runtime-api` | The shared typed contract between renderer and main process (`@xmcl/runtime-api`): Zod schemas, service descriptors (`ServiceKey` + interface), channels, task monitors and CLI command definitions. |
| `packages/` | 34 published libraries under `@xmcl/*`: core, installer, modrinth, curseforge, user, instance, resource, resourcepack, gamesetting, model, text-component, file-transfer, wrtc-multiplayer, discord-rpc, sqlite, client, nbt, schematic, yauzl, and more. |
| `xmcl-asar` | Template package for prebuilt `app.asar` bundles published per platform (`@xmcl/app-win|mac|linux...`) so users behind the GFW can fetch updates/installs via the npmmirror CDN. |
| `installer/` | Standalone portable install scripts (`install.ps1`, `install.sh`) that reconstruct a runnable launcher from the Electron prebuilt + the `@xmcl/app-<platform>` asar package. |
| `e2e/` | Opt-in Playwright end-to-end tests (outside the default workspace): safety-net CI group, manual showcase storylines and gitignored PR-local scratch specs. |
| `mock/` | Fixture data for Vitest unit tests: sample mods, resource packs, worlds, version JSONs and modpack archives. |
| `i18n/` | Community-translated documentation (READMEs, contributing guides) plus a localization getting-started guide. |
| `assets/` | Architecture/design diagrams and image assets. |

### Service highlights (`xmcl-runtime`)

Users & auth, instances & instance options, installers & version metadata, launching, Java discovery,
modpacks, instance import/export, resource parsing, saves & region editing, themes, marketplace,
mod metadata & project mapping, server status, Discord presence, WebRTC peer connections, Bedrock
(UWP), Authlib Injector, Yggdrasil server, Ely.by, LittleSkin, collections, playtime, adaptive
network/download mirrors, CLI commands, telemetry, and the Limyrx Client manifest service.

## Tech stack

- **Language/run**: TypeScript 5.9, Node.js ≥ 22, pnpm 11
- **Desktop**: Electron 43, electron-builder, electron-updater, esbuild
- **UI**: Vue 3.5, Vuetify 4, vue-i18n 11, vue-router 4, UnoCSS, Sass
- **Visuals**: three.js, skinview3d, vanta, custom GLSL shaders
- **Data**: zod schemas, Kysely + `node:sqlite`, yauzl/unzip, atomic JSON persistence
- **Network**: undici, node-datachannel (WebRTC), MSAL (Microsoft auth)
- **Quality**: Vitest, Playwright, oxlint, oxfmt, vue-tsc

## Development

### Prerequisites

- Node.js **22.16+**
- pnpm **11+**

### Setup

```bash
git clone https://github.com/ILMaRkz-Y/Limyrx-Client.git
cd Limyrx-Client
pnpm install
```

The `e2e` sub-project is intentionally **not** installed by default (it pulls Playwright). Install it
on demand:

```bash
pnpm e2e:install
```

### Run (development)

```bash
pnpm dev:renderer    # Vue renderer dev server (limyrx-keystone-ui)
pnpm dev:main        # Electron main process in development mode (limyrx-electron-app)
```

### Build

```bash
pnpm build:renderer  # build the Vue renderer into limyrx-keystone-ui/dist
pnpm compile         # compile every workspace package
pnpm build           # production build of the Electron app (limyrx-electron-app)
pnpm build:all       # full production build including electron-builder targets
```

### Run the built app

```bash
npx electron ./limyrx-electron-app/dist/index.js
```

## Testing & quality

```bash
pnpm check           # type-check every package (tsc / vue-tsc)
pnpm lint            # oxlint across packages + UI + runtime
pnpm lint:fix
pnpm format          # oxfmt
pnpm test            # Vitest unit tests
pnpm coverage        # unit tests with coverage
```

### End-to-end (Playwright)

The e2e suite runs the packaged launcher via Playwright's Electron driver (no browser download
needed). Three groups:

- `pnpm test:e2e:ci` — deterministic, network-free safety-net tests, auto-run in CI (boot smoke tests).
- `pnpm test:e2e:showcase` — manual promo storylines that hit live network endpoints and capture
  captioned screenshots used as tutorial material.
- `pnpm test:e2e:scratch` — gitignored PR-local scratch specs for visual verification.

See `e2e/README.md` and `AGENTS.md` for the full workflow (including the `data-testid` registry in
`e2e/TESTIDS.md`, refreshed via `pnpm gen:testids`).

## Internationalization

UI strings live in `limyrx-keystone-ui/locales/*.yaml` (29 locales). Tooling:

```bash
pnpm i18n           # extract/update translation keys
pnpm lint:i18n      # validate locale files
pnpm i18n:remove    # remove a key
pnpm i18n:rename    # rename a key
pnpm i18n:daemon    # watch mode
```

## Release & CI

GitHub Actions pipelines handle validation (`validate.yml`), multi-OS builds (`build.yml`), core
package builds/releases (`core-*.yml`), e2e (`e2e.yml`), AppX code signing (`sign-release.yml`),
release artifact mirroring to Azure/npm/homebrew/winget/flatpak (`deploy-release.yml`), and renderer
deploys to Vercel (`deploy-ui.yml`).

Releases flow from a `chore(release)` commit: draft release → AppX signing → asset mirroring + npm
publish of the `@xmcl/app-*` asar bundles.

## License

MIT License — see [LICENSE](LICENSE) for details.
