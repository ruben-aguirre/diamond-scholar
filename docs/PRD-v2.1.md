# Diamond Scholar — Game Plan (PRD)

### What Is This Document?

PRD stands for **Product Requirements Document**. It's a blueprint — like the plans an architect draws before building a house. This document tells the people building the game (that's you and your dad, using AI tools!) exactly what the game should do, how it should look, and how it should feel. If it's not in this document, it doesn't get built. If it IS in this document, it DOES get built.

---

## 1. The Big Idea

**Diamond Scholar** is a baseball video game that helps kids get better at school while they play. You pick a team, play games, earn **Scholar Coins** by answering science, spelling, and other subject questions between innings, and use those coins to buy card packs with new players. The better your team gets through games and practice, the harder the games get — so you're always being challenged.

**Who is this game for?**
- Kids in 3rd, 4th, and 5th grade (with the ability to add more grade levels later — see Section 4)
- Kids who love baseball
- Kids who want to get better at science, spelling, and more subjects over time (starting with anatomy/the human body for science)

**What makes this game different from other learning games?**
Most learning games feel like homework with a coat of paint. Diamond Scholar is a *real baseball game* that happens to teach you things. The learning part is woven INTO the game — not bolted on top of it. You don't stop playing to learn. You learn so you can keep playing.

---

## 2. How the Game Works — The Big Picture

Here is the basic loop (a "loop" is what game designers call the pattern that keeps repeating in a game):

```
Pick Your Team → Play an Inning → Answer Questions → Play Next Inning → 
Answer More Questions → Play Final Inning → See Your Results → 
Go Home → Practice / Open Card Packs / Get Ready for Next Game
```

### The Game Day Loop (One Full Game)

1. **Before the Game**: You set your batting lineup and choose who plays each position.
2. **Inning 1**: You play offense (batting) and defense (pitching/fielding) — just like real baseball.
3. **Study Break 1**: You answer 5 questions. Each correct answer earns you 10 Scholar Coins.
4. **Inning 2**: More baseball.
5. **Study Break 2**: 5 more questions. Same deal — 10 coins each.
6. **Inning 3 (Final Inning)**: Last chance to win the game.
7. **Study Break 3**: 5 final questions.
8. **Bonus Round** (only if you got at least 4 out of 5 right in Study Break 3): Keep answering questions until you get 3 wrong. Every correct answer is worth 10 Scholar Coins.
9. **Game Over Screen**: Shows the score, your stats, and how many Scholar Coins you earned.

**Mercy Rule**: If one team is ahead by 7 or more runs at the end of any full inning, the game ends early. This is just like real baseball — it keeps things from getting boring when a game is lopsided.

### The Home Screen Loop (Between Games)

When you're not playing a game, you go to your **Home** screen. It looks like a little baseball-themed area. From here you can:

- **Batting Practice** — Make your players better at hitting
- **Fielding Practice** — Make your players better at catching and throwing
- **Running Practice** — Make your players faster on the bases
- **Card Shop** (open every Saturday in-game) — Buy card packs with your Scholar Coins, sell players you don't want, or get a free player
- **My Team** — See your roster, check player stats, rearrange your lineup
- **Play a Game** — Start your next game

---

## 3. Baseball Gameplay — How It Actually Plays

### The Feel

The game should feel like **Backyard Baseball** — cartoony, fun, colorful, and not super complicated. Simple controls. No 50-button combos. Click or tap to do things.

### Batting

- You see the **strike zone** on screen (a rectangle over home plate).
- The pitch comes toward you, and you see a **marker** showing where the ball is heading inside the strike zone.
- You click/tap to swing.
- On the **side of the screen**, you have buttons to choose your swing type BEFORE the pitch:
  - **Swing** — Normal swing
  - **Power Swing** — Harder hit, but easier to miss
  - **Bunt** — Soft hit, good for advancing runners
  - **Half Swing** — Check swing, less commitment
- You also have a **Steal** button you can press to tell a runner on base to try to steal.

### "Did You Know?" Cards (Ambient Learning)

Between each batter, while the game transitions to the next at-bat, a **"Did You Know?" card** appears on screen. This is a bite-sized fact — one sentence — tied to whatever subject the player is currently rotating through.

**Examples:**
- *"Did you know? Your femur is the longest bone in your body!"*
- *"Did you know? The word 'their' shows something belongs to a group of people."*
- *"Did you know? 7 × 8 = 56 — the two digits (5 and 6) are right next to each other!"*

**How it works:**
- The card appears **during** the transition animation (the camera moving to the next batter, the lineup card updating, etc.). It does NOT pause gameplay — the game is already taking a moment to set up the next at-bat.
- The card stays on screen for about **5 seconds**, then fades out as the next batter steps up.
- There is **no skip button** and **no timer countdown**. It just shows up and goes away naturally.
- There is **no quiz on it**. No accountability. No pressure. It's ambient — like a fun fact on the back of a cereal box.
- The content is pulled from the same subject/grade pool as the study break questions, so it reinforces the same material the kid is being tested on.

**Why this works (for Dad and Grandma):** This is called "incidental learning" — absorbing information without trying to because it's embedded in something you're already doing. Over the course of a game with ~18–30 at-bats, that's 18–30 micro-exposures to curriculum content, none of which feel like learning. The study breaks are where the real accountability happens. The Did You Know cards are passive reinforcement — planting seeds.

### Pitching

- You choose what kind of pitch to throw (fastball, curveball, changeup, slider).
- You click where you want to aim it in the strike zone.
- Your pitcher throws it. Better pitchers hit their spots more accurately.

### Fielding

- When the ball is hit, the game automatically moves the closest fielder toward the ball.
- You click/tap to throw to a base.
- Better fielders move faster and throw more accurately.

### Running

- Runners move automatically on hits.
- You can click to tell them to advance to the next base or hold up.

### Difficulty Scaling

This is important. The game starts **easy** and gets **harder** as your players improve. This way it never feels like you're playing on "creative mode" (your words!) — you always have to earn your wins.

How it works:
- Every player has stats: **Batting**, **Pitching**, **Fielding**, **Speed** (each rated 1–10)
- As your team's overall stats go up, the opposing teams get tougher too
- Pitches come faster, fielders react quicker, hitters are more dangerous
- This keeps every game feeling competitive

---

## 4. The Learning System — Study Breaks

### The Rules

- 5 questions per study break
- 3 study breaks per game (one between each inning)
- Each correct answer = 10 Scholar Coins
- If you get at least 4 out of 5 right in the LAST study break, you unlock the Bonus Round
- Bonus Round: keep going until you get 3 wrong (every correct answer = 10 coins)
- Maximum earning per game (without bonus): 150 Scholar Coins
- Bonus Round has no ceiling — a kid who's on fire could earn a LOT of coins

### Subjects

- **Science — Human Body / Anatomy** (MVP subject, 4th grade at launch)
- **Spelling** (second subject, grade level TBD pending curriculum book from Grandma)
- **Math** (future)
- **English / ELA** (future)

Each study break gives you questions from **one subject** — the game rotates between available subjects across the 3 study breaks. With one subject, all 3 breaks pull from that subject. With two subjects, the game alternates (e.g., Science, Spelling, Science). With three or more, each break covers a different subject.

### Extensibility — Adding More Grades and Subjects Later

The game is built so that new grade levels and new subjects can be added WITHOUT rebuilding the game. Think of the question system like a filing cabinet:

- Each **drawer** is a subject (Science, Spelling, Math, English — and eventually more like History, Spanish, etc.)
- Inside each drawer, there are **folders** for each grade level (1st, 2nd, 3rd, 4th, 5th — and eventually higher)
- Each folder holds a **stack of question cards** and a **stack of Did You Know facts**

To add a new grade or subject, you just add a new folder or drawer. The game already knows how to pull from whatever's there. This matters because younger players may want to join later — and the same architecture supports adding lower grade levels without a rebuild.

### Question Format

Questions are **multiple choice** with 4 answer options (A, B, C, D). This keeps it fast and avoids the frustration of typing answers.

When you get one right:
- You see a green checkmark and hear a satisfying "ding" sound
- The 10 coins get added to your wallet with a little coin animation
- A short 1-sentence explanation tells you WHY the answer is right

When you get one wrong:
- No harsh penalty — you just don't earn the 10 coins
- The correct answer is highlighted and you see a short explanation
- No buzzer sounds, no red X flashing. Just a calm "here's the right answer" moment.

### Why This Matters (Game Psychology)

Your son told us: *"I want to quit when the problem makes no sense, I'm tired, and no one's there to help me."*

So the game is designed to avoid all three of those triggers:

1. **Problems that make no sense** → Every question has a 1-sentence explanation, right or wrong. The game IS the helper.
2. **Being tired** → Study breaks are SHORT (about 90 seconds for 5 multiple-choice questions). They're rest stops, not roadblocks.
3. **No one there to help** → Wrong answers don't punish. They teach. The tone is a coach, not a teacher with a red pen.

### Grade Selection

**Grades are set per subject, not globally.** A kid might be at a 4th grade level in science but 3rd grade in spelling and 5th grade in math. When a player first sets up their profile, they pick their grade level for each available subject independently. This sets the difficulty of the questions for that specific subject. Questions get slightly harder over time as the player answers more correctly (adaptive difficulty).

Example: A profile might have `Science: 4th grade, Spelling: 3rd grade`. The game pulls 4th-grade questions during science study breaks and 3rd-grade questions during spelling study breaks.

### Question Source (For Dad and Grandma)

**Phase 1**: Questions are AI-generated based on the curriculum books being used at home. Dad will provide book titles and table of contents, and Claude will generate question banks from those topics.

**Phase 2**: Grandma can review and approve the question banks — and she can add her own custom questions if she wants.

The system should be designed so that adding new question packs (new subjects, new grade levels) is easy in the future.

---

## 5. Players and Teams

### Player Stats

Every player has 4 main stats, each rated from 1 to 10:

| Stat | What It Does |
|------|-------------|
| **Batting** | How likely they are to make contact and how far the ball goes |
| **Pitching** | How accurate and fast their pitches are |
| **Fielding** | How quickly they react and how accurate their throws are |
| **Speed** | How fast they run the bases |

### Roster Size

- Each team has **12 players** (9 starters + 3 bench/backup)
- You can set your own batting order and fielding positions before each game

### Player Design

- Players look like **cartoony versions of real MLB archetypes** 
- **NOT real players** — fictional characters with names that feel familiar but are legally distinct
- Examples:
  - Sho Otani (power-hitting, two-way player)
  - Mike Trout → Mick Trotter (speedy outfielder)
  - Mookie Betts → Cookie Betts (all-around star)
  - Fernando Tatis Jr. → Fernando Torres Jr. (flashy shortstop)
- Each player has a simple visual design — like Backyard Baseball's style but slightly more detailed
- Players should reflect the diversity of real MLB rosters

### How You Get Players

**Starting Team**: You begin the game with a team of 9 average players (stats mostly 3–5 range). Enough to play, but there's obvious room to improve.

**Card Packs**: You spend Scholar Coins to buy card packs in the Card Shop (open on Saturdays in-game).

- **Bronze Pack** — 100 coins — common players (stats 3–6)
- **Silver Pack** — 300 coins — good players (stats 5–7)
- **Gold Pack** — 750 coins — great players (stats 7–9)
- **Diamond Pack** — 2,000 coins — elite players (stats 8–10)

When you buy a pack, you see an animation of the pack opening and the player card being revealed (name, picture, stats). This should feel exciting — like opening a real pack of baseball cards.

**Selling Players**: You can sell players you don't need. Sell prices are fixed by player tier and are always less than what the pack cost — no way to profit from buying and selling:
- Bronze player sells for 30 coins
- Silver player sells for 100 coins
- Gold player sells for 250 coins
- Diamond player sells for 700 coins

**Free Player**: Once per Saturday event, you get one free Bronze pack. Free packs **cap at 2 unclaimed** — if you don't play for a while, you come back to a maximum of 2 free packs waiting, not a giant pile of them.

### Pitcher Switching

You can switch pitchers during a game. Your starting pitcher gets tired over time (their pitching stat slowly drops as they throw more pitches). Smart players will need to manage their bullpen.

---

## 6. Game Modes and Seasons

### Regular Season

- You play games against different AI teams
- You can pick which MLB-inspired team you want to represent
- You can play in different stadiums (visual variety)
- The season is structured in **weeks** — you play a few games per week

### All-Star Game (Every 3 Weeks)

- The game picks the best players across all teams (or the player can pick them)
- Two All-Star teams play a special exhibition game
- Winning gives bonus Scholar Coins

### World Series (Every 4 Weeks)

- A mini-playoff: best-of-3 series
- The stakes are higher, the energy is bigger
- Winning the World Series gives a trophy and a significant Scholar Coins reward

### Stats Tracking

After every World Series (or any time from the "My Team" screen), you can see:
- Each player's batting average
- Games played
- Home runs
- RBIs
- Pitching stats (ERA, strikeouts)
- How many Scholar Coins you've earned total
- Questions answered correctly by subject

---

## 7. Practice Modes

These are available from the Home screen anytime (not just Saturdays).

### Batting Practice

- **Entry Question**: Before practice begins, you answer 1–2 quick questions (same format as study breaks, earns 10 coins each). Think of it as the "entry ticket" to practice — a short learning moment while you're already in a voluntary, low-pressure mode.
- A pitching machine throws balls at you
- You practice timing your swings
- The game shows you the strike zone and where the ball is heading (guided tutorial style)
- As you hit more balls, it starts removing the guide — so you're learning to read pitches on your own
- Spending time here slowly improves your selected player's Batting stat

### Fielding Practice

- Balls are hit to different positions
- You practice throwing to the right base
- Teaches you the basic decisions: "Ground ball to shortstop — where do I throw?"
- Improves your selected player's Fielding stat

### Running Practice

- Practice base running decisions: when to run, when to hold, when to slide
- Improves your selected player's Speed stat

**Important**: Practice should be SHORT sessions (2–3 minutes). It's a tool, not a grind. The stat improvements are small but meaningful — maybe +0.1 to +0.3 per session, so a player rated 4 in Batting might take 10–20 sessions to reach 7.

---

## 8. How Time Works in the Game

The game uses an **in-game calendar**, not real-world time. Here's how it maps:

| In-Game Event | When It Happens |
|--------------|----------------|
| Regular game | Anytime the player wants to play one |
| Saturday Card Shop | Every 7th in-game day (so roughly every 4–5 games) |
| All-Star Game | Every 3 in-game weeks |
| World Series | Every 4 in-game weeks |

This means the game doesn't pressure kids to play every day. They can play at their own pace.

---

## 9. User Profiles

The game supports **multiple player profiles** so both kids can play on the same device without interfering with each other.

Each profile stores:
- Player name
- Grade levels per subject (e.g., Science: 4th, Spelling: 3rd — controls question difficulty per subject; more grade levels can be added later)
- Team name and roster
- Scholar Coins balance
- Season record and stats
- Questions answered correctly / incorrectly by subject
- Practice progress

---

## 10. Technical Plan

### Phase 1: Web App (Build First)

- **Built with**: React (JavaScript framework)
- **Runs in**: Any web browser (Chrome, Safari, Firefox, Edge)
- **Works on**: Computer, tablet, phone (responsive design)
- **Built using**: Claude Code (AI-powered coding tool)
- **Art style**: 2D cartoony sprites and backgrounds — a mix of AI-generated images and simple geometric/vector art. AI-generated for characters and environments, vector for UI elements and icons.
- **Sound**: AI-generated sound effects unique to the game (bat crack, crowd cheer, coin ding, card pack opening, etc.). Kids should review and approve key sounds like the bat crack — a kid who plays real baseball will notice if it sounds wrong.
- **Data storage**: Browser local storage for player profiles (no account needed, no cloud sync in Phase 1). Each profile is stored under a separate key. A profile selection screen ("Who's playing?") appears on launch, and the current player's name is displayed on screen at all times to prevent accidental wrong-profile play. Auto-save triggers at the start of each inning to prevent progress loss and rage-quit do-overs.

### Phase 2: Installable App (Future, Optional)

- Convert the web app into a standalone desktop/mobile app using something like Electron or Capacitor
- Add cloud save so profiles sync between devices
- Only do this if the game is getting regular use and the kids want it

### What Needs to Be Built (In Order)

1. **Player profile setup** — Pick your name, team name, grade level per subject
2. **Home screen** — The hub with all the buttons
3. **Team management** — View roster, set lineup, set positions
4. **Basic batting mechanic** — See pitch, click to swing, ball goes somewhere
5. **Basic pitching mechanic** — Pick pitch type, pick location, throw
6. **Basic fielding** — Ball hit, fielder moves, throw to base
7. **Basic running** — Runners advance, scoring works
8. **Full game flow** — 3 innings, score tracking, outs, mercy rule
9. **Study break system** — Questions appear between innings, money earned
10. **"Did You Know?" cards** — Ambient facts between at-bats
11. **Bonus round** — Triggered by going 4/5 or 5/5 in last study break
12. **Card shop and card packs** — Buy packs, see reveal animation, add to roster
13. **Practice modes** — Batting, fielding, running
14. **Season structure** — Weekly calendar, All-Star games, World Series
15. **Stats tracking** — Player stats, earnings, question accuracy
16. **Multiple profiles** — Support for different players on same device
17. **Question bank system** — Importable question sets by subject and grade, built for easy expansion to new grades and subjects

---

## 11. What "Done" Looks Like

The game is "done" for Phase 1 when a kid can:

- [ ] Create a profile and pick their grade level for each subject independently
- [ ] See their Home screen and navigate to all areas
- [ ] Set their batting lineup and field positions
- [ ] Play a full 3-inning game with batting, pitching, fielding, and running
- [ ] See "Did You Know?" fact cards between each at-bat
- [ ] Experience the mercy rule if a blowout happens
- [ ] Answer 5 questions between each inning
- [ ] Earn Scholar Coins for correct answers
- [ ] Trigger and play the Bonus Round (by getting at least 4/5 in the last study break)
- [ ] Go to the Card Shop on Saturday and buy/open card packs
- [ ] Get a free Bronze pack once per Saturday
- [ ] Sell players they don't want
- [ ] Do batting practice (with entry questions), fielding, and running practice
- [ ] See their player stats and season record
- [ ] Switch profiles so another kid can play
- [ ] Play at least 1 subject of questions for MVP (Science — Human Body/Anatomy at 4th grade), with architecture ready for spelling, math, and English to be added
- [ ] Feel like the game gets harder as their team gets better

---

## 12. What "Wrong" Looks Like (Things to Avoid)

These are the traps we need to watch out for:

| Trap | Why It's Bad | How We Avoid It |
|------|-------------|----------------|
| Too much learning, not enough playing | Kids stop playing | Keep study breaks to ~90 seconds (5 multiple-choice questions). 1:1 ratio of play time to learn time. |
| Questions that make no sense | Frustration, quitting | Every question has a short explanation. Multiple choice only. Adaptive difficulty. |
| No help when stuck | The "I'm tired and alone" feeling | Wrong answers show the right answer + why. No punishment. Coach tone, not teacher tone. |
| Game is too easy and stays easy | Boring — "creative mode" feeling | Difficulty scales with team stats. Always a challenge. |
| Game is too hard too fast | Frustration, quitting | Start easy. Scale gradually. Practice modes exist to help. |
| Card packs feel impossible to earn | "What's the point" feeling | A kid answering most questions right can afford a Bronze pack every game, a Silver every 3 games. |
| One kid's progress affects another's | Sibling fights | Separate profiles. Completely isolated data. No transfers. |
| Kids game the economy | Exploits undermine the learning loop | Anti-gaming rules: sell prices always below pack cost, free pack cap of 2, auto-save prevents do-overs. |

---

## 13. The Economy — Does the Math Work?

The in-game currency is called **Scholar Coins**. Let's check if the card pack prices feel fair:

- **Per game earnings (no bonus)**: 15 questions × 10 coins = **150 Scholar Coins max**
- **Per game earnings (average kid, ~67% correct)**: ~100 coins
- **Per game with a good bonus round** (say 5 extra correct): 150 + 50 = **200 Scholar Coins**
- **Batting practice bonus**: 1–2 extra questions per session = 10–20 extra coins

| Pack | Cost | Games to Afford (Average Kid) |
|------|------|------------------------------|
| Bronze (100 coins) | 100 | ~1 game |
| Silver (300 coins) | 300 | ~3 games |
| Gold (750 coins) | 750 | ~7–8 games |
| Diamond (2,000 coins) | 2,000 | ~20 games |

This feels right. Bronze packs are still a "play one game, buy a pack" reward (keeps the card-opening loop going). Diamond packs are a real long-term goal — roughly 5 World Series cycles to save up for one. The numbers are bigger now, which feels more satisfying to a kid. "I have 2,000 Scholar Coins" hits different than "I have 1,000."

### Anti-Gaming Rules

| Rule | Why It Exists |
|------|--------------|
| Free Saturday packs cap at 2 unclaimed | Prevents hoarding from long absences — come back after 6 months, you get 2 free packs, not 26 |
| Sell prices are fixed by tier and always below pack cost | Prevents buy/sell profit loops — the only way to earn coins is answering questions |
| Subjects rotate in fixed order across study breaks | Prevents cherry-picking a strong subject to farm bonus rounds |
| Profiles are fully isolated, no transfers | Prevents cross-profile coin/player trading exploits |
| Auto-save at start of each inning | Prevents rage-quit do-overs — if you close the game mid-match, you pick up where you left off |

Plus: the free Bronze pack every Saturday means even a kid having a rough day gets something.

---

## 14. Research-Backed Design Decisions

This section is for Dad (and Grandma). Here's why specific choices were made, backed by actual research on how kids learn through games.

**Why the learning is BETWEEN innings, not during gameplay:**
Research on "flow state" (the feeling of being totally absorbed in what you're doing) shows that the best learning happens when challenge and skill are balanced and feedback is immediate. Interrupting the baseball gameplay with pop-up quizzes would break flow. By placing learning in dedicated, short breaks, each activity gets its own flow state — the kid is either fully locked in on baseball OR fully locked in on questions. Never awkwardly both.

**Why questions have explanations, not just right/wrong:**
Studies on educational games for kids ages 9–10 consistently find that immediate, specific feedback is one of the top three features that keep kids engaged. A correct answer with no explanation teaches nothing. A wrong answer with no explanation teaches frustration. The explanation is the actual teaching moment.

**Why difficulty scales up with player improvement:**
The research calls this "challenge-skill balance" — it's the core ingredient of the flow state described by psychologist Mihaly Csikszentmihalyi. When challenge matches skill, kids are engaged. When challenge is too low, they're bored. When it's too high, they're anxious. Diamond Scholar's auto-scaling keeps the kid right in the sweet spot.

**Why card packs are the reward, not just money:**
The "variable reward" is one of the most psychologically compelling mechanics in game design. You know you're getting a player — you just don't know which one. That uncertainty creates excitement and anticipation. It's the same reason Clash of Clans chests are fun to open. The key difference: in Diamond Scholar, you earn packs through learning, not through spending real money. No microtransactions. Ever.

**Why the game lets kids co-design it:**
Research from 2021 found that when children aged 10–12 participated in the design process of an educational game, their engagement increased significantly and 60% perceived themselves as learning while playing. That's literally what's happening here — your son helped design this game from scratch. He has ownership of it. That psychological investment will make him more likely to stick with it.

**Why "Did You Know?" cards work better than forced mini-lessons:**
Game psychology research consistently shows that forced interruptions between micro-actions (like individual at-bats) fragment the flow state and reduce engagement. But *ambient information* delivered during natural transition moments — like loading screens in Minecraft or tip screens in Fortnite — is absorbed passively without breaking immersion. This is called "incidental learning." Over 18–30 at-bats per game, that's 18–30 micro-exposures to curriculum content that the kid never consciously "studied." The study breaks handle the accountable learning. The Did You Know cards handle the passive reinforcement. Two layers of learning, zero extra friction.

---

## 15. MVP Scope

The MVP (first playable version) launches with **one subject (Science — Human Body/Anatomy) at 4th grade level**. The architecture supports adding more grades and subjects without rebuilding — but we ship with one to get the game into kids' hands faster.

**Second subject: Spelling.** Once the MVP is working and the science questions are validated, Spelling gets added as the second subject. Dad needs to provide the spelling curriculum book so questions can be generated at the right level. Spelling is a priority second subject.

After that, additional subjects (Math, English) and grade levels get added as new question packs.

### Question Source Strategy

**Primary source**: AI-generated questions based on the actual curriculum books being used at home. Dad provides book scans (science book already uploaded to the project folder) and Claude generates question banks aligned to those specific topics.

**Secondary reference**: CK-12 (a free, open-content education platform with Creative Commons-licensed material) can be used to fill gaps where the home curriculum books don't cover a topic deeply enough.

**Standards checklist**: IXL's publicly available skill lists by grade level can be used as a cross-reference to make sure the AI-generated questions hit the right learning standards — even though IXL's actual content is closed/paid.

**Why not Khan Academy?** Khan Academy is still widely used and free, but they shut down their public API in 2020. There's no legitimate way to pull questions from them programmatically. More importantly, depending on an external platform's infrastructure means Diamond Scholar stops being self-contained — and "Scholar Coins" as a portable brand element only works if the game owns its own content.

**Grandma review**: Once the first question bank is generated, schedule a review session. She can approve, edit, or add her own custom questions.

---

## 16. Open Questions (Stuff We Still Need to Figure Out)

1. ~~Curriculum books~~ → **RESOLVED**: Science book scanned and uploaded. Give scans to Claude Code at build time, not in the PRD.

2. ~~Art assets~~ → **RESOLVED**: Mix of AI-generated (characters, environments) and vector/geometric (UI elements).

3. ~~Sound effects~~ → **RESOLVED**: AI-generated, unique to the game. Kids review key sounds.

4. **Testing**: Once a first build is ready, both kids should play it and give feedback. We should plan for at least 2–3 rounds of "play it, tell us what's broken or not fun, fix it, repeat."

5. **Spelling curriculum book**: Needed for the second subject — the priority add after the science MVP.

6. **Math and English curriculum books**: Still needed for future subject expansion.

7. **Grandma review session**: Schedule once the first science question bank is generated.

---

## 17. Glossary (Words You Might Not Know)

| Word | What It Means |
|------|--------------|
| **PRD** | Product Requirements Document — this plan you're reading right now |
| **React** | A tool for building websites and web apps. It's what we'll use to build the game. |
| **Sprite** | A small picture of a character or object used in a game |
| **UI** | User Interface — the buttons, menus, and screens you see and click on |
| **Loop** | A pattern in a game that repeats. Good loops are what make games fun to play over and over. |
| **Flow State** | When you're so focused on something that you lose track of time. The "zone." |
| **Adaptive Difficulty** | When the game automatically gets harder or easier based on how well you're doing |
| **Responsive Design** | A website that looks good on any screen size — computer, tablet, or phone |
| **Local Storage** | A way for a website to save data on your device without needing the internet |
| **Microtransaction** | When a game charges you real money for in-game items. We are NOT doing this. |
| **Scholar Coins** | The in-game currency you earn by answering questions correctly. Used to buy card packs. |
| **MVP** | Minimum Viable Product — the simplest version of the game that still works and is fun |
| **Claude Code** | The AI coding tool Dad will use to actually build this game |
| **Incidental Learning** | Absorbing information without trying to, because it's part of something you're already doing — like reading a fun fact while waiting for the next batter |
| **Extensible** | Built so you can add new stuff (like more grades or subjects) later without rebuilding the whole thing |

---

*Document created: April 11, 2026*  
*Last updated: April 12, 2026*  
*Game Designers: Ruben and Son*  
*Builder: Claude Code*  
*Version: 2.1 — Per-subject grade selection, MVP corrected to 4th grade science (not 5th), spelling added as second subject priority, subject rotation logic updated for variable number of active subjects*
