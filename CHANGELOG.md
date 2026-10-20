# Changelog

All notable changes to Skyrim Wellbeing Manager. Dates are deploy dates.

## 2026-10-20

### Added
- **Today** home screen on desktop and phone: vitals, the daily log, dailies and bounties in one place.
- Weekly **bounties** (triple XP, guaranteed loot, reset Monday).
- **Standing Stones**: Warrior, Mage, Thief, Lover; changeable once a week.
- **Earned perks**: a perk needs a point, a linked star, and completed quests in that skill. Each unlocked perk trains its tree 2% faster.
- **Vital decay**: Health, Magicka and Stamina drift down 2 points an hour between logs. Heal Self restores 25 health.
- **Shout cooldown** with a recharging Voice meter.
- First-day guide: name, race, stone and starter dailies.
- Real-life meanings beside every lore skill; chart legend names mood, energy and rest.
- Stats: last-7-days trend, mastery card, per-skill bars. Quest log grouped by type with rewards.
- Delete character from the System menu.
- Phone layout with tab bar, bottom sheets, and a compass that follows the device heading.
- PWA manifest and icons; deep links work on GitHub Pages.
- Gemini calls go through a Cloudflare Worker that verifies the player's sign-in; the key no longer ships to browsers.
- Firestore rules with schema validation; build-time Content Security Policy.

### Changed
- Every character change runs in a Firestore transaction (no more lost XP).
- Map filters per tile and keeps compass state out of the app tree (60 fps panning).
- Journey map records one point per place per day and clusters markers.
- Loading screen is pure CSS and can be skipped once data is ready.
- Quests are created instantly; the AI lore arrives a moment later.
- Project uses Bun; CI builds with Bun.

### Removed
- The flip-book Tome, trackpad scroll gestures, the timed wisdom ticker, Three.js, Recharts, the ClosedAI bot workflow.

### Fixed
- Black screen on GitHub Pages caused by circular Firebase chunks.
- "The realm resists" when completing quests created by older versions.
- Compass pointed South when facing North; Tab opened the menu while typing; geolocation denial hung the map.
