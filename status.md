# Diamond Scholar — Status

**Current state:** Passes 1–4 mostly built — batter's-box view, interactive pitching (pitch types + Fireball powerup), interactive fielding (visible fielders, runners, animated steal), and the lineup editor with per-player batting averages. Everything renders on one HTML canvas inside a single 2,771-line `GameScreen.jsx`.

**Next move:** Pass 5 (Card Shop) is the next numbered pass — but before building it, get the June pitching/fielding work in front of son for a playtest. His feedback outranks more building.

---

## Pass progress (order locked in CLAUDE.md)

1. Batter's-box view + DYK fix + study-break manual advance — **DONE** (Apr 2026)
2. Interactive fielding (tap-a-base throw, visible fielders) — **mostly done**
3. Interactive pitching (pitch type + location) — **done+** (pitch types move differently, named on screen, Fireball powerup)
4. Lineup editor + team picker — **lineup editor done**; all-30 MLB-team picker not started
5. Card Shop (Bronze/Silver/Gold/Diamond packs + open animation) — **not started**
6. Practice modes (Batting / Fielding / Running) — **not started**

Beyond the plan: STEAL mechanic with animated catcher throw; Exit → Save/Close dialog; batting average that only goes up (kid-friendly).

## Open friction (why sessions stall)

1. **Field layout keeps getting re-fought.** 2nd base has been repositioned across Jun 4, 9, 22, 26 — the last two commits of the project are both "put 2nd base behind the mound." Cause: the field is hand-drawn with hardcoded pixel coords (`GameScreen.jsx:40-42`), so every nudge is a commit-then-eyeball loop. Fix isn't another tweak — it's a faster way to see changes (dev overlay or draggable bag).
2. **One giant file.** ~2,800 lines in `GameScreen.jsx`; every change risks touching everything. Slows the short-iteration loop.
3. **Visual style undecided.** CLAUDE.md says placeholder vector sprites first, AI art only if vectors still aren't appealing. Sprite briefs exist (PDFs, May); decision still open.
4. **No playtest logged.** Son's playtest is the #1 signal, but there's no record the June pitching/fielding work has been put in front of him. Risk: the base tinkering is adult intuition, which CLAUDE.md warns against.

## Stack (locked)

Vite + React 19 (not Next.js). Repo `8signal/diamond-scholar`, branch `master`, deployed to Vercel. PRD: `../Diamond-Scholar-PRD-v2.1.md`.
