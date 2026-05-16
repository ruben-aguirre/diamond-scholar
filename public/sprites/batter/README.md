# Batter Swing Sprites

Drop the artist's PNGs into this folder with these exact filenames:

```
frame-1.png   Stance
frame-2.png   Load
frame-3.png   Stride
frame-4.png   Initiation
frame-5.png   Contact
frame-6.png   Extension
frame-7.png   Wrap
frame-8.png   Finish
```

## Requirements

- **Square aspect ratio** (recommended 192×192 or 256×256 px)
- **Transparent background**
- **Same pixel pivot in every frame** — the batter's feet should land at the same coordinate across all 8 frames, so the character doesn't drift when the animation cycles
- **PNG-32 with alpha channel**

## How it works

The game preloads all 8 frames when `GameScreen` mounts. During a swing, the
animation plays through frames 1→8 over ~260ms. Between pitches, frame 1
(stance) is shown as the idle pose.

If any frame fails to load (file missing, network error), the game falls back
to the canvas-drawn batter (the math-based `drawBatter()` in
`src/screens/GameScreen.jsx`) so the game stays playable.

## Replacing placeholder frames

You don't need to do anything — just drop the 8 PNGs in here and reload. The
sprite loader picks them up automatically. No code changes required.

If the artist's natural sprite size is different from 192×192, you can adjust
the on-canvas rendered size in `drawBatterSprite()` (search for `SPRITE_SIZE`
in `src/screens/GameScreen.jsx`).
