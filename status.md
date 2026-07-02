# Diamond Scholar — Status

**Current state:** Passes 1–4 mostly built (batter's-box view, interactive pitching, fielding, lineup editor), all on one HTML canvas in a single 2,771-line `GameScreen.jsx`. Repo is now public. Actively working on batter character art via Atlas Cloud — have a good behind-the-batter pixel-art swing sheet (v3), still needs transparency fixed.

**Next move:** Run Atlas Cloud background remover on the v3 sprite sheet to get a true transparent PNG. Then decide with son: is 10 frames fine, or force exactly 8. Separately, still owe son a playtest of the June pitching/fielding work before building Pass 5 (Card Shop).

<!-- HANDOFF: refreshed by /handoff -->
_Handoff updated: 2026-07-01_

**Where things live**
1. Game code: `ruben-aguirre/diamond-scholar` repo (branch `master`, public), cloned at `personal-projects/baseball-learning-game/diamond-scholar/`. Almost everything is in `src/screens/GameScreen.jsx` (2,771 lines).
2. Sprite work-in-progress: `personal-projects/baseball-learning-game/working files/` — `batter-swing-spritesheet-behind-v3.png` is the keeper (behind view, pixel art, 5x2 = 10 frames). v1/v2 were side-profile tries.
3. Community help post draft: `personal-projects/baseball-learning-game/clief-notes-help-post.md` — ready to post, not posted yet.

**Since last handoff**
1. Made the repo public. Scrubbed all personal details about the kids from the PRD (spelling struggle, homeschool, family makeup) in both the live file AND git history (force-pushed), then added PRD + status.md to the repo.
2. Fixed CLAUDE.md: repo is `ruben-aguirre/diamond-scholar` (personal account, public), not `8signal/`.
3. Wrote the Clief Notes help post — reframed to "my son and I want the fundamentals," repo + PRD links included.
4. Generated batter sprites on Atlas Cloud (Nano Banana Pro Edit). Landed on behind-the-batter pixel-art swing (v3) matching the Baseball 9 camera angle Ruben referenced.

**Open decisions / waiting on**
1. Sprite frame count: model keeps giving 10 frames in a grid, not 8 in a row. Decide if 10 is fine (it slices in code either way) or push for exactly 8.
2. Whether to run the help post live in the Clief Notes Skool community.

**Watch out**
1. Atlas keeps returning JPG/RGB with the transparency baked in as a gray checkerboard (no real alpha). v3 is RGB — the checkerboard is fake. Must run the background remover before it's usable in-game.
2. The private source PRD at `baseball-learning-game/Diamond-Scholar-PRD-v2.1.md` still has the kids' personal details. Do NOT re-copy it over the public repo copy without scrubbing again.
3. Getting exactly-8-frames-single-row out of these image models is unreliable. Don't burn generations chasing it — slice by grid in code instead.
<!-- /HANDOFF -->

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
