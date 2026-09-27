# Diamond Scholar — Status

**Current state:** All six agreed build passes are now playable. The game has batting, pitching, fielding, lineup management, a 30-club picker, animated card packs, and short Batting / Fielding / Running practice modes with a science entry question, coin rewards, and saved skill growth. Production build and lint both pass.

**Next move:** Put the full loop in front of Ruben's son: create a fresh profile, play one game, open a pack, and try each practice mode. Log only the places where he gets confused, bored, or stuck before adding season features.

<!-- HANDOFF: refreshed by /handoff -->
_Handoff updated: 2026-09-26_

**Where things live**
1. Game code: `ruben-aguirre/diamond-scholar` repo (branch `master`, public), cloned at `personal-projects/baseball-learning-game/diamond-scholar/`. Almost everything is in `src/screens/GameScreen.jsx` (2,771 lines).
2. Sprite work-in-progress: `personal-projects/baseball-learning-game/working files/`. The live game currently uses `public/sprites/batter/swing-sheet.png` with a safe placeholder fallback.
3. Community help post draft: `personal-projects/baseball-learning-game/clief-notes-help-post.md` — ready to post, not posted yet.

**Since last handoff**
1. Added and enabled all three practice modes. Each starts with one science question, awards 10 coins for a correct answer, runs six short reps, and saves a 0.1–0.3 skill gain for the chosen player.
2. Added a phone-friendly picker with 30 fictional, MLB-city-inspired clubs plus a custom-team option.
3. Verified the new-player and batting-practice flow in the browser at 390 × 844. Coins and the skill increase persisted, with no browser errors.
4. Cleared the existing lint failures in `GameScreen.jsx`; both `npm run lint` and `npm run build` now pass.

**Open decisions / waiting on**
1. Son's playtest result for the now-complete six-pass loop.
2. Whether to build the PRD's larger season/calendar layer after that playtest.
3. Whether to run the help post live in the Clief Notes Skool community.

**Watch out**
1. The private source PRD at `baseball-learning-game/Diamond-Scholar-PRD-v2.1.md` still has the kids' personal details. Do NOT re-copy it over the public repo copy without scrubbing again.
2. `GameScreen.jsx` is still about 3,000 lines. The game works, but future changes there need careful browser checks.
<!-- /HANDOFF -->

---

## Pass progress (order locked in CLAUDE.md)

1. Batter's-box view + DYK fix + study-break manual advance — **DONE** (Apr 2026)
2. Interactive fielding (tap-a-base throw, visible fielders) — **DONE**
3. Interactive pitching (pitch type + location) — **DONE** (pitch types move differently, named on screen, Fireball powerup)
4. Lineup editor + team picker — **DONE**
5. Card Shop (Bronze/Silver/Gold/Diamond packs + open animation) — **DONE**
6. Practice modes (Batting / Fielding / Running) — **DONE**

Beyond the plan: STEAL mechanic with animated catcher throw; Exit → Save/Close dialog; batting average that only goes up (kid-friendly).

## Open friction (why sessions stall)

1. **Field layout keeps getting re-fought.** 2nd base has been repositioned across Jun 4, 9, 22, 26 — the last two commits of the project are both "put 2nd base behind the mound." Cause: the field is hand-drawn with hardcoded pixel coords (`GameScreen.jsx:40-42`), so every nudge is a commit-then-eyeball loop. Fix isn't another tweak — it's a faster way to see changes (dev overlay or draggable bag).
2. **One giant file.** ~2,800 lines in `GameScreen.jsx`; every change risks touching everything. Slows the short-iteration loop.
3. **Visual style undecided.** CLAUDE.md says placeholder vector sprites first, AI art only if vectors still aren't appealing. Sprite briefs exist (PDFs, May); decision still open.
4. **No playtest logged.** Son's playtest is the #1 signal, but there's no record the June pitching/fielding work has been put in front of him. Risk: the base tinkering is adult intuition, which CLAUDE.md warns against.

## Stack (locked)

Vite + React 19 (not Next.js). Repo `8signal/diamond-scholar`, branch `master`, deployed to Vercel. PRD: `../Diamond-Scholar-PRD-v2.1.md`.
