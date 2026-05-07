# Engine Research — Future Options for Diamond Scholar

A reference list of game engines / frameworks worth considering if Diamond Scholar
outgrows the current React + HTML Canvas stack. Captured during the swing-animation
work in May 2026 when the limits of canvas-drawn-batter became obvious.

**Current stack:** React 19 + Vite + plain HTML5 Canvas 2D, deployed to Vercel as
a PWA. Single-page web app. No game engine — every entity (batter, pitcher, ball,
field) is drawn from scratch with `ctx.beginPath()` calls each frame.

---

## Why this list exists

The pure-canvas approach is great for the current scope (study questions wrapped
in a baseball UI), but starts to break down when we want:

- Smooth character animation (we hit this with the swing)
- Multiple animated characters on screen at once (fielders, runners)
- Sprite-sheet workflows
- Sound, music, particles handled idiomatically
- Touch/gamepad input that "just works" on mobile

The two engines below would each solve those, at different costs.

---

## 1. Godot — https://github.com/godotengine/godot

**License:** MIT (truly free, no royalties, no per-export costs)
**Latest release at time of writing:** 4.6.2-stable (April 2026)
**Primary language internally:** C++. **Game scripting language:** GDScript
(Python-like) or C#.
**Stars:** 110k+. Mature, well-supported open-source project.

### What it is
A full multi-platform 2D and 3D game engine. Has its own editor (think Unity but
free and lighter). Scenes are trees of nodes (Sprite, AnimatedSprite, Camera,
RigidBody, etc.). Animation is first-class — a built-in `AnimationPlayer` and
`AnimationTree` mean a swing animation is a few drag-and-drop keyframes, not 300
lines of pose-interpolation math.

### What's good for Diamond Scholar
- **Sprite animation built-in** — drop the 8 swing frames into an `AnimatedSprite2D`,
  set framerate, done. No more hand-rolled keyframe interpolation.
- **2D pipeline is mature** — Godot's 2D mode is a first-class feature (not 3D
  with the Z disabled like some engines). Perfect for our chibi cartoon look.
- **Web export** — Godot exports to HTML5/WebAssembly, so we could still deploy to
  Vercel and keep the PWA model.
- **Free forever** — no royalties even on a hit game.
- **Decent for educational games** — node tree + scenes structure maps cleanly
  onto study-mode vs. game-mode screens.

### Why it's overkill for where we are now
- **Different stack entirely** — we'd be leaving React/Vite behind. The HTML
  shell, profile setup, Did-You-Know cards, etc., would all have to be rebuilt
  in Godot's UI system or we'd run Godot inside a `<canvas>` with React around it.
- **GDScript or C#** — neither is JavaScript. Existing game logic
  (`GameEngine.js`, `players.js`, scoring, swing-result calc) all gets ported.
- **Editor-driven workflow** — Godot really wants you in its editor. Pure-code
  workflow is possible but fights the grain.
- **Bigger asset bundle** — Godot's HTML5 export ships ~30-40MB of WASM/runtime
  per game, vs. our current ~80kb gzipped JS bundle. Bad for the "load instantly"
  PWA feel.
- **Tooling investment** — learning the Godot editor, animation system, signal/node
  patterns. Probably 20-40 hours to feel comfortable shipping with it.

### When Godot starts to make sense
- We add full pitching gameplay (real fielding, base running, multi-character
  animations on screen at once)
- We want desktop/Steam or native mobile builds, not just web/PWA
- The "feels like a real baseball game" goal becomes a primary differentiator
- We're committing to building Diamond Scholar as a long-running game product,
  not just a study-aid wrapper

---

## 2. GDevelop — https://gdevelop.io/

**License:** Free tier + paid subscriptions for advanced exports.
**Cost:** Free for web. **Silver** unlocks Android + Steam. **Gold** unlocks iOS
and higher AI usage.
**Engine type:** No-code, event-system based. Optional JavaScript escape hatch.

### What it is
A visual, drag-and-drop game engine. You build games by configuring "events"
(when X happens, do Y) instead of writing code. Aimed at non-developers, teachers,
and indie creators. Supports 2D and basic 3D, exports to web, Android, Steam,
and iOS depending on plan.

### What's good for Diamond Scholar
- **Lower learning curve than Godot** — no real coding required for most things.
  The event editor is approachable.
- **Sprite animation built-in** — same story as Godot, swing frames just work.
- **Multiplayer, leaderboards, accounts** built-in as features.
- **Mobile-first feel** — the toolchain is designed for casual mobile games, which
  matches the Diamond Scholar audience (kids on phones/tablets).
- **AI tutor assistance** — they have an in-tool AI helper, similar vibe to me
  but baked in.

### Why it's overkill / wrong fit for where we are now
- **No-code is a ceiling, not a floor** — anything custom (our timing-based
  swing-result math, the question pool logic, study-streak gating) gets harder
  to express in events than in JavaScript.
- **Vendor lock-in risk** — the project format is GDevelop-specific. If they
  change pricing or shut down the cloud features, we have to migrate.
- **Subscription cost to publish to mobile** — we already have a PWA path that
  works on iOS and Android free.
- **Same migration cost as Godot** — leaving React/Vite, rewriting everything in
  the GDevelop event system.

### When GDevelop starts to make sense
- We want to hand off content authoring to someone non-technical (a teacher
  building custom question packs into mini-games).
- We're prototyping a sister-product (a different sport, a math version) and
  want to ship something playable in days, not weeks.
- The audience asks for a native iOS/Android build and we don't want to deal
  with native tooling.

---

## Honest current recommendation

**Stay on the React + Vite + Canvas stack** for now. The friction we hit on the
swing animation is real, but the right fix is probably **option 2 from the
animation conversation: pre-rendered sprite frames** — generate 8 chibi swing
frames in the character builder, drop the PNGs into `public/`, swap them in
canvas with `ctx.drawImage()` per frame.

That gets us a Baseball-9-quality swing without leaving the stack we already know.

**Revisit Godot or GDevelop when:**
- We've shipped at least one full feature (working full game with all 9 innings
  and proper fielding/baserunning), AND
- We're hitting performance or animation walls the canvas approach can't solve, AND
- The product has enough usage to justify a 3-6 week rewrite.

Until then, every hour spent on engine migration is an hour not spent on
content (more questions, more study modes, more grade levels).

---

## Sprite generation tools (currently in use / on standby)

These are how we'd get the actual character art for the canvas-with-sprites
approach. Neither is a game engine — they produce frame sets we'd drop into
`public/sprites/` and animate via `ctx.drawImage()`.

### PixelLab.ai — https://www.pixellab.ai/editor

**Currently in use.** AI-driven sprite art generator with built-in character
consistency across rotations and animation frames. Purpose-built for what we
need: an 8-frame swing of a single consistent character.

- **Style:** Pixel art (16-bit, 32-bit retro game aesthetic).
- **Output:** Frame-by-frame PNGs with transparent backgrounds, consistent
  dimensions and pivot point per frame.
- **Why it fits Diamond Scholar:** Solves the frame-to-frame consistency problem
  that generic image generators (Midjourney, DALL-E, Sora) can't handle for
  animation. Pixel art also fits the kid-friendly retro vibe of a study game
  better than smooth-vector chibi would.
- **Workflow:** Generate character → generate animation frames → export PNG
  set → drop into repo → swap frame in canvas per swing-progress tick.
- **Caveat on art style:** The original character description we drafted was
  for smooth cel-shaded chibi (Baseball 9 look). If we use PixelLab, we
  rewrite the description for pixel-art chibi and embrace the retro look.

### Liberated Pixel Cup (LPC) + Universal LPC Spritesheet Generator

**Backup option** if PixelLab doesn't deliver what we need.

- **What LPC is:** An open-source art project (sponsored by Creative Commons,
  Mozilla, FSF, OpenGameArt) that established a standardized pixel-art style
  with a curated asset library — overhead 16-bit RPG style, 32×32 tile base,
  front-facing orthographic perspective.
- **The character generator:** A separate community-maintained tool (Universal
  LPC Spritesheet Character Generator) lets you build a humanoid character by
  layering body, hair, clothes, gear, etc., and download a finished
  spritesheet with multiple animations baked in (walk, attack, etc.).
- **License:** Dual CC-BY-SA 3.0 + GPLv3 — free to use, but derivative works
  must be share-alike. **Worth checking** whether SA terms create any
  obligation we don't want for a commercial product down the road.
- **What's good:** Free. Huge asset library. Predictable format. No AI
  variability — same input always gives same output.
- **Limitations vs. PixelLab:** No baseball-specific animation. The default
  animations are RPG-style (walk, slash, cast). A baseball swing would have
  to be hand-edited from the existing attack frames or commissioned. Camera
  angle is overhead/orthographic — different from the catcher-cam back-3/4
  view we want.
- **When it makes sense:** If PixelLab can't deliver consistent batter sprites,
  or if we want a fully open-source art pipeline. May require a pixel artist
  to adapt LPC base frames into baseball poses.

---

## Other engines worth knowing about (not deeply researched here)

- **Phaser** (https://phaser.io) — JavaScript-native 2D game framework. Closest
  fit to "upgrade without leaving the web stack." Sprite animation, physics,
  input — all built in. Probably the lowest-friction upgrade path if canvas
  becomes the bottleneck. **Worth a real look before either of the above.**
- **PixiJS** (https://pixijs.com) — WebGL 2D renderer. Faster than canvas for
  many sprites but lower-level (no game framework on top). Good if it's a pure
  rendering bottleneck.
- **Three.js** — mentioned earlier in the swing conversation. Real 3D in the
  browser, but probably too much for chibi 2D-style baseball.
- **Unity** — industry standard. Massive learning curve, license costs at scale,
  much heavier than Godot. Skip unless we're targeting a major commercial release.

---

*Last updated: May 2026. Keep this file alive as we evaluate options.*
