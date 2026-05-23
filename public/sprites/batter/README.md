# Batter Swing Sprites

The artist delivers a **single sprite sheet** containing all 8 swing frames in
a horizontal strip. Drop it in this folder with this exact filename:

```
swing-sheet.png
```

## Sheet format

- **Layout:** 8 frames in a single horizontal row (left → right)
- **Recommended size:** 2048 × 256 px (so each frame is 256 × 256)
- **Other sizes work too** — the loader derives per-frame width from the
  sheet's natural dimensions, so 1024 × 128 (128 px frames) or 1536 × 192
  (192 px frames) also work, as long as it stays 8 frames wide.
- **Transparent background**
- **Same pixel pivot in every frame** — the batter's feet should land at the
  same coordinate across all 8 frames so the character doesn't drift when
  the animation cycles.
- **PNG-32 with alpha channel**

## Frame order

```
[1] Stance    [2] Load    [3] Stride   [4] Initiation
[5] Contact   [6] Extension   [7] Wrap   [8] Finish
```

## How it works

The game preloads `swing-sheet.png` when `GameScreen` mounts. During a swing,
the animation plays frames 1→8 over ~260ms by slicing the sheet at the right
x-offset each render via `ctx.drawImage(sheet, sx, sy, sw, sh, dx, dy, dw, dh)`.
Between pitches, frame 1 (stance) is shown as the idle pose.

If the sheet fails to load, the game falls back to a generated placeholder
strip (numbered rectangles), and then further to the canvas-math
`drawBatter()` in `src/screens/GameScreen.jsx` — the game stays playable
either way.

## Replacing the sheet

Just drop the new `swing-sheet.png` in here and reload. No code changes
required. The loader picks it up automatically.

If the artist's natural frame size is different from 256 × 256, you can
adjust the on-canvas rendered size by changing `SPRITE_DISPLAY_SIZE` in
`src/screens/GameScreen.jsx` (currently 192).
