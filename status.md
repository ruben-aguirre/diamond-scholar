# Diamond Scholar — Status

**Current state:** All six agreed build passes are playable. The live game now also has a 15-team league, larger standings with Halloween decorations, and a five-second matchup screen before each game. All 43 tests, lint, production build, and rendered-screen checks pass; the production bundle is verified.

**Next move:** Refresh https://diamond-scholar.vercel.app and press Play Ball from Home or Team Standings. Check that the matchup shows both teams, counts down five seconds, and starts a game against the same opponent. Ruben and his son's visual playtest remains pending.

## Five-second matchup intro — 2026-10-28

- ✓ Done. Both Play Ball entry points now show the player's club and the scheduled computer opponent with team-color badges, win/loss/tie records, and a 5–4–3–2–1 countdown. The game starts automatically after five seconds. Halloween artwork appears during Halloween.
- The intro freezes the opponent and passes that same matchup into gameplay. Gameplay remains unmounted until the countdown finishes. Back to Home cancels both timers; another game gets a fresh five-second intro. Previewing or cancelling does not advance standings or spend rewards.
- Code commit `caec935` pushed to `origin/master`. Production deployment `dpl_2WPC55oVHdxn5rq4ctnTXXst5ovk` is Ready at https://diamond-scholar.vercel.app; the live script contains the matchup countdown and team layout. All 43 tests, lint, and production build pass. New timer tests verify the five-second boundary, a single start, cancellation, and restarting; rendered-screen checks verify both correct teams and no gameplay canvas during the intro. Visual playtest remains with Ruben and his son.

## Standings readability and Halloween decorations — 2026-10-28

- ✓ Done. From Ruben's screenshot: enlarged standings text to 18px and numbers to 20px on larger screens, increased cell padding from 12px to 18px vertically, widened the card to 980px, and gave the number columns more room. Help text and captions are 16px; phone rows retain 16px text and 17px numbers with wrapping team names.
- Reused the existing pumpkin/candy SVG artwork above and below the table, plus decorations in the side gutters on wide screens. An orange border frames the card during Halloween. Decorations follow the existing seasonal calendar, cannot intercept clicks, and are hidden from screen readers.
- Code commit `f8ad634` pushed to `origin/master`. Production deployment `dpl_6fFHbmNQ4JexscQ4zzaCqGi5TtpT` is Ready at https://diamond-scholar.vercel.app; updated live styles and script verified. Lint/build and rendered-screen checks passed; all 15 rows and one YOU marker remain, with Halloween decorations absent outside that season. Visual review remains with Ruben and his son.

## 15-team league — 2026-10-28

- ✓ Done. Added Team Standings to the home menu and a View standings link beside the league record. Shows ranks 1–15, wins, losses, ties, winning percentage, and a highlighted YOU row. Home shows the next opponent; gameplay scoreboards, opponent batter label, and final score use that club's name.
- One player-controlled club plus 14 distinct fictional computer clubs, drawn from the existing club list without duplicating the player's club. The 30-club setup picker remains available. Each saved player has a separate league. Older profiles start the league at 0–0 without changing their career stats, coins, roster, or powerups.
- Every club faces every other club once over 15 rounds, with one club resting each round; the schedule then repeats. Completed games update both clubs and simulate the other computer matchups. A player's rest round is simulated alongside their next completed game. Ties count as half a win for ranking, followed by wins, run difference, and alphabetical order. Saving and exiting early does not advance the league; stale or duplicate results cannot double-count games or rewards.
- Published code commit `ab2f3f7` to `origin/master`. Git-connected production deployment `dpl_CaEYnqPf5ZdPEEbfBwWD4fEiKYAj` is Ready at https://diamond-scholar.vercel.app; the live script contains the new standings screen and matchup text. Scalekit has no Vercel connection; used the existing Vercel CLI for deployment inspection.
- All 40 engine/league/pack/season tests, lint, and production build pass. Rendered Home and Standings checks confirm 15 club rows, one YOU marker, and the home navigation/matchup text. Visual and full-game playtesting remain with Ruben and his son.

## Pitcher on the mound — 2026-10-08

- Second positioning pass from screenshot: moved the pitcher's cleats 10 canvas pixels toward the batter and shortened the leg geometry from 30 to 20 drawing pixels. Kept the 78% overall scale; release point follows the updated hand. Published `dpl_DiWM7aFU9wULh9mMKBbAqkP96M9b`; live build verified, lint/build pass.
- Playtest size correction: pitcher scaled to 78%, about one head shorter, anchored at his cleats. Pitch release coordinates follow the scaled hand. Published `dpl_VfM78gKD6SF9Xw91rzpKhgJY1FFf`; live build verified, lint/build pass.
- Pitcher now draws over the painted stadium as well as the fallback field, with feet on the mound, a small glove on his right hand (viewer left), and a ball in his left hand. Opponent jersey is red; the player's defensive pitcher wears the team color.
- Throwing arm follows through over 260ms. The held ball disappears at pitch release; the airborne ball begins at that exact hand position. It stays out of his hand during contact/results and returns when ready for the next pitch. Applies to batting, defense, and Fireballs.
- Published `dpl_D3jGEcUzMm5e7wDPPupLfCdvmH5R`; live asset verified. All 33 tests, lint, and build pass. Visual playtest remains with Ruben and his son. Changes remain uncommitted locally.

## Diamond Pack payments — 2026-10-08

- Diamond Packs cost 1,050 Scholar Coins or 3 tokens, with separate buttons and balances visible in Card Shop. Each button checks only its own balance. Other packs retain coin-only prices.
- Pending packs save their price and payment type. Don't Keep returns coins or tokens as paid; older pending purchases without a currency field still refund their original coin price.
- Published `dpl_734GEKym4yrNUXKVYWHkVsj8LL3d`; live price/buttons verified. All 29 tests, lint, and build pass. Changes remain uncommitted locally.

## Card choices — 2026-10-08

- Card Shop now offers Keep and Don't Keep for every revealed card. Don't Keep refunds the full pack price and leaves the roster alone. Keep adds the player or asks for a replacement when the team has 12 players.
- Paid cards and their original cost are saved until resolved, so refresh preserves the pending choice. Purchase/choice guards prevent duplicate refunds or duplicate additions. Free holiday cards refund zero and remain claimed for the season.
- Published `dpl_7hPYV2L3iq4HFb4a9fFejTyZcrvy` and verified live scripts. All 24 tests, lint, and build pass. Changes remain uncommitted locally.

## Game length — 2026-10-08

- Added a home-page gear button and Settings screen with 1, 3, or 9 innings. Saves immediately per profile; existing profiles default to 3. Play Ball and both scoreboards show the chosen length, which is fixed when a game starts.
- End-of-game and bonus-round checks use the selected length, so a 9-inning game no longer stops at inning 3. The existing 7-run mercy rule remains and is explained in Settings.
- Published `dpl_2Z32KPA6ggxQCEGXowzpD8juYzBB` to the live Vercel game and verified its script. Eighteen tests, lint, and build pass. Local changes remain uncommitted.

## Holiday update — 2026-10-08

- Halloween night games: home stadium and gameplay background now have a dark sky, stars, moon, bright floodlight banks and beams. Background is cached; the ball, players and scoreboard keep normal brightness. Halloween victories launch a short orange/purple/green fireworks display behind the results, with a still version for reduced motion. Losses/ties and other seasons have no fireworks. Published `dpl_7x12jnERNLAUiTpWMBu5NSopkFyU`; live assets verified, lint/build and rendered-component checks passed. Visual playtest remains with Ruben and his son.
- Follow-up from Ruben's home-screen screenshot: added large SVG jack-o'-lanterns and wrapped candy in the desktop gutters, a pumpkin/candy garland above the stadium that remains visible on phones, and an orange stadium border. Decorative art cannot intercept clicks. Published deployment `dpl_7s79joN9rbKUXMKzeEqBtVY261pB`; live decoration bundle verified, lint/build pass.
- Halloween runs October 1–31 using the player's local calendar: dark gray backgrounds, a dimmer field, pumpkins, candy, and orange/purple lights. Christmas runs December 1–31: white backgrounds, colorful lights, trees, and presents. The calendar is checked every minute while the app is open.
- Each profile can open one free Gold Pack per holiday per year. Home and Card Shop show the gift. Claim history and the unopened card are saved together; refreshing preserves the card and cannot claim another pack. A full team uses the usual replace/keep-team choices. Unfinished gifts can be completed after the season ends.
- Published deployment `dpl_6bRf2VGPmHF2ZbJthpQyWq7z9MYe` to https://diamond-scholar.vercel.app; READY and live scripts/styles verified. Fourteen engine/season tests, lint, and production build pass. Visual playtest remains with Ruben and his son. Changes remain uncommitted locally.

## Playtest changes — 2026-10-08

- Ruben reported bunts never connect. Bunts now have a fixed 75% chance of a single, independent of timing and batting skill.
- Added Diamond Bat: a regular home run fills the counter to two uses. Equip it before the pitch; each swing consumes one use, including misses and fouls. Fair contact becomes a home run, with the existing over-the-fence animation and scoring; foul balls stay foul. Boosted home runs do not refill the bat.
- Unused Diamond Bat uses persist through Save and completed games, like Fireballs. Old profiles start with zero.
- Published to https://diamond-scholar.vercel.app on 2026-10-08 after Ruben reported the bat was missing in the Vercel game. Deployment `dpl_7RcVy3B7M3b9PW7Npy6yN7Xzbhc8` is READY; the live script contains Diamond Bat and the foul-ball exception. Eight engine tests, lint, and production build pass. Changes remain uncommitted locally.

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
