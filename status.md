# Diamond Scholar — Status

**Current state:** All six agreed build passes are playable. The live game includes the 20-game league/calendar, readable Did You Know cards, blue player runners, and immediately saved science streak tokens in regular quizzes and bonus rounds. Existing progress and rewards are preserved. All 60 tests, lint, production build, and rendered-screen checks pass; the production bundle is verified.

**Next move:** Refresh https://diamond-scholar.vercel.app, finish an inning, and answer five science questions correctly in a row. The fifth answer should show Token earned and an increased saved wallet balance immediately. Check bonus-round streaks too. Ruben and his son's visual playtest remains pending.

## Immediate science streak tokens — 2026-10-29

• ✓ Done. Ruben reported five right answers without a token. Regular quizzes computed the award only on See Results, showed a short message that could be hidden by the bonus/game-over screen, and saved the wallet only on game exit/completion. Bonus questions did not count toward tokens at all. Regular and bonus questions now share the same five-correct-answer streak calculation and award on the fifth answer.

• Added a visible token-earned message, wallet total, and 0–4 out of 5 streak meter to both quiz types. Streaks carry across inning quizzes and into the bonus round; wrong answers reset only the unfinished streak. Each earned token updates the saved profile immediately, so refreshing after earning it retains it. The game HUD shows the saved wallet balance and the final screen lists tokens earned.

• Per-game cumulative reward receipts prevent the immediate award from being credited again on quiz completion, Save, or finished-game settlement. Answer/completion guards prevent repeated clicks from duplicating rewards. Save now uses the latest saved profile so it cannot overwrite a newly credited wallet balance. Existing coin and batting-stat settlement remains on Save/game completion.

• Code commit `bb972dd` pushed to `origin/master`. Production deployment `dpl_AePgEgAH6UqGqEbQQEqmWjSxwtzT` is Ready at https://diamond-scholar.vercel.app; the live script contains immediate reward saving, saved-wallet messaging, and the streak meter. All 60 tests, lint, and build pass. Seven new tests cover five/ten right answers, wrong answers, cross-quiz/bonus carry, persistence, duplicate settlement, separate games/profiles, and invalid totals. Rendered component checks verify the award message, saved balance, and carried streak. Full-game visual playtest remains with Ruben and his son.

## Blue player runners — 2026-10-29

• ✓ Done. Ruben's screenshot showed a red player on first base who looked like an opposing fielder. That character is the player's baserunner; it was inheriting the red Archers club color while the batter sprite stayed blue. Player runners now use blue on base and during steals. Opponent runners use red during their batting half.

• Code commit `20b7d49` pushed to `origin/master`. Production deployment `dpl_7ESm4RS4VgEa7ca6bXAg2iQZkSKM` is Ready at https://diamond-scholar.vercel.app. Verified the live script matches the new local production bundle and contains the blue uniform color. Lint and production build pass. No scoring, movement, saved-data, or defender-color changes. Visual playtest remains with Ruben and his son.

## Did You Know contrast fix — 2026-10-29

• ✓ Done. Ruben's screenshot showed near-white fact text and close icon on a white card. The card and close button inherited the Halloween theme's light text color. Both now use fixed dark slate text; the heading uses dark orange, and the fact text is slightly bolder. Close-button hover and keyboard focus are also clearly visible.

• Lint and production build pass. Checked the actual color pairs: fact/white 14.68:1, heading/white 6.21:1, close-button foreground/background 12.79:1, and hovered close button 6.57:1. No gameplay or saved-data changes; existing game tests were not rerun for this CSS-only fix.

• Code commit `a0eef56` pushed to `origin/master`. Production deployment `dpl_9zmYQsdt86TduwVzGzvJSN4XyHBy` is Ready at https://diamond-scholar.vercel.app; verified the live card, close-button, and heading color rules. Scalekit has no Vercel connection, so the existing Vercel CLI was used for release inspection. Visual playtest remains with Ruben and his son.

## Monthly Games calendar — 2026-10-28

- ✓ Done. Added Games to the home menu. Opens a real Sunday–Saturday month grid with month/year heading, previous/next month arrows, Today and Next Game shortcuts, game-number markers, opponents/current ranks on larger screens, and played/next/coming-up states. Phone cells keep the date and game number; selecting a date shows the full matchups below.
- Each of the season's 20 dates shows the same seven fixtures used by gameplay, current standings positions for all 14 playing clubs, and the resting computer club's name/rank. The player's matchup leads the list. Only the next scheduled game can be launched; selecting a later date does not skip or simulate games. Completed seasons link to final standings. Rankings are explicitly current, including when viewing past dates; historical scores are not invented.
- The season calendar anchor is saved on first Games visit or game launch, then stays fixed across refreshes. Existing saves place their next game on the first-visit date and earlier season dates are reconstructed game-day slots, not claimed historical play dates. Each next season clears the date anchor. Calendar slots are one per game day; players can play ahead without real-calendar waiting. Halloween garland reuses the existing artwork.
- Code commit `f8563aa` pushed to `origin/master`. Production deployment `dpl_EsFGiz9HLwbqkVTaWW1ndjWtHGbv` is Ready at https://diamond-scholar.vercel.app; the live script contains the Games calendar, month navigation, and ranked matchup list. All 53 tests, lint, build, and rendered-screen checks pass. Tests cover all 20 scheduled fixtures versus gameplay, no doubleheaders, saved dates, migration, current ranks, next-season dates, weekday alignment, leap day and month/year boundaries. Visual playtest remains with Ruben and his son.

## 20-game seasons — 2026-10-28

- ✓ Done. Ruben shortened the season to 20 player games. Home, Standings, and the five-second matchup now show Game N of 20 and season progress. Wins, losses, and ties each count as one finished game. Leaving early does not count; the existing single-game innings setting remains separate.
- Game 20 leads to final standings and names the champion using the established ranking rules. Further league games are blocked until the player chooses Start Next Season. That action starts another 20-game season, retains players/rewards/career stats, and saves the preceding final standings under `league.previousSeason`. Existing league results are retained; an older save with 20 or more finished games is treated as complete without trimming its records.
- Added season-number checking so a stale result from the preceding season cannot count in the new season. The one-game-per-league-day rule remains in force across season restarts.
- Code commit `4c3f203` pushed to `origin/master`. Production deployment `dpl_59LLbrF4udwZ9oAdvYyR6vp6xzaq` is Ready at https://diamond-scholar.vercel.app; the live script contains the 20-game rule, final standings, champion, and next-season button. All 48 tests, lint, build, and rendered-screen checks pass, including exact game-20 completion, blocking extra games, safe restart, and first/final/completed-screen rendering. Visual playtest remains with Ruben and his son.

## One game per league day — 2026-10-28

- ✓ Done. Ruben's screenshot showed some computer teams with two games after the player's first game. The cause was simulating a skipped player rest round alongside the next played round. Finished games now process only that day's seven fixtures: the player's game plus six computer games, with one computer club resting. No club plays twice in a league day. A league day advances when the player finishes a game; this does not impose a real-calendar waiting period.
- Version-1 leagues are repaired at read time by subtracting only the repeatable computer results from skipped player rest rounds; the next completed game saves version 2. Actual player games, scores, wins, career stats, roster, coins, tokens, and powerups remain intact. Repeated reads do not subtract twice. The standings, home page, and matchup intro now show the upcoming league day.
- The player still faces all 14 opponents before their schedule repeats. Because skipped player rest rounds are omitted, computer clubs now play 13 games for each 14 player games; the UI explains the one-computer-club rest day instead of promising a complete round-robin among all computer clubs.
- Code commit `50cf8fa` pushed to `origin/master`. Production deployment `dpl_2bNojMn6uwFmLzkiRfiPdPHyq76s` is Ready at https://diamond-scholar.vercel.app; the live script contains league-day labels and the one-game-per-day rule. All 46 tests, lint, build, and rendered-screen checks pass. Regression tests cover 60 league days and repairs of actual 1-game and 16-game legacy save snapshots. Visual playtest remains with Ruben and his son.

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
