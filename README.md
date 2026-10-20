# 🏔️ Skyrim Wellbeing Manager

[![Deploy to GitHub Pages](https://github.com/woodRock/moody-bitch/actions/workflows/deploy.yml/badge.svg)](https://github.com/woodRock/moody-bitch/actions/workflows/deploy.yml)
[![Tests](https://github.com/woodRock/moody-bitch/actions/workflows/test.yml/badge.svg)](https://github.com/woodRock/moody-bitch/actions/workflows/test.yml)
[![HackerNoon Featured](https://img.shields.io/badge/HackerNoon-Featured-green?logo=hackernoon)](https://hackernoon.com/skyrim-wellbeing-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**An immersive, gamified wellbeing and mood tracker inspired by *The Elder Scrolls V: Skyrim*.**

Turn your day into quests. Scribe a daily log to keep Health (mood), Stamina (energy) and Magicka (rest) high. Level up real skills on a constellation perk tree, cast spells that are actually wellbeing exercises, and chart where life happened on the Journey Map.

---

## 🎮 Play

👉 **[Hosted version](https://woodrock.github.io/moody-bitch/)** — uses a shared Firebase project. Your data is only readable by your account, but for full ownership host your own (below).

**Desktop** is the full Skyrim experience: trackpad gestures, the four-way character menu (`Tab`), the system menu (`Esc`), the horizon compass and the constellation skill tree.

**Phone** gets the simplified satellite: a thumb-friendly tab bar (Quests · Log · Skills · Magic · Items), bottom sheets instead of overlays, and a compass that turns with your phone's real heading on the map. Add it to your home screen for a standalone app.

---

## ✨ Features

- **⚔️ Quests** — daily and one-off tasks that grant skill XP. Dailies reset at midnight. Every 5th completed quest drops loot.
- **📜 The Chronicle** — a daily mood/energy/rest log with three triumphs. Streaks grant bonus XP. Read it back as a leather-bound flip-book (the Tome).
- **🌌 Skill constellations** — eight real-life skills, each a star chart of perks you unlock with points earned from levelling.
- **🔮 Magic** — *Heal Self* (gratitude), *Calm* (4-7-8 breathing), *Transmute Thought* (AI reframing), *Summon Familiar* (reach out to someone), plus three Shouts: double XP, silence notifications, Zen mode.
- **🗺️ Journey Map** — a sepia Leaflet map of where quests and logs happened, with markers on the HUD compass. Opt-out and clear it any time from System.
- **🎭 The HUD** — Skyrim's bars, compass, banners, the level-up screen, the loading screen tips, and the sounds.

---

## 🛠️ Tech

React 19 · TypeScript · Vite 7 · Bun · Firebase Auth + Firestore · Framer Motion · Leaflet · react-pageflip · Vitest.

The game rules (XP, levelling, loot, streaks, compass maths) are pure functions in `src/game/` with unit tests, and every change to your character runs in a Firestore transaction so nothing is lost to races.

---

## 🚀 Run it yourself

```bash
bun install
cp .env.example .env    # fill in your Firebase config
bun run dev
```

Other scripts:

| Script | What it does |
|---|---|
| `bun run build` | Type-check and build to `dist/` |
| `bun run check` | Lint, type-check and test |
| `bun run emulators` | Start the Firebase Auth + Firestore emulators; then run `VITE_USE_EMULATORS=true bun run dev` |
| `bun run icons` | Regenerate the PNG app icons from `public/icons/icon.svg` (needs librsvg) |

### Firebase setup

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
2. **Authentication → Sign-in method**: enable *Email/Password* and (optionally) *Google*. Add your hosting domain under *Authorized domains*.
3. **Firestore Database**: create it, then deploy the rules and indexes from this repo:
   ```bash
   bunx firebase-tools login
   bunx firebase-tools use <your-project-id>
   bunx firebase-tools deploy --only firestore
   ```
4. **Project settings → Your apps → Web**: register an app and copy the config into `.env`.

### AI lore (optional)

Quest descriptions and the Thought Forge use Gemini. Without any key the app uses built-in fallback text.

- **Recommended:** deploy the proxy in [`worker/`](worker/README.md) (a free Cloudflare Worker). It keeps the Gemini key server-side, verifies the player's Firebase sign-in, and rate-limits per user. Set `VITE_LORE_PROXY_URL`.
- **Legacy:** `VITE_GOOGLE_API_KEY` embeds the key in the client bundle, where anyone can read it. If you must, restrict the key in Google Cloud to your site's HTTP referrers and to the Generative Language API only.

### Deploying to GitHub Pages

Push to `main`. The workflow builds with Bun and publishes `dist/`. Add the `VITE_*` values as repository secrets. `public/404.html` makes deep links work on Pages. To host at a domain root instead, set `VITE_BASE_PATH=/`.

---

## 🛡️ Security notes

- Firestore rules are owner-only with schema validation (types, ranges, lengths, allowed keys) on every collection. Nothing is world-readable.
- The Firebase web config is public by design; access control is in the rules and Auth.
- A production Content Security Policy is injected at build time (`vite.config.ts`).
- Location recording is per-user, togglable, and deletable from the System menu.
- Password resets never reveal whether an address has an account.

---

## 🛡️ License

MIT — see [LICENSE](LICENSE). Fan-made; not affiliated with Bethesda.

*May the Divines guide your path.*
