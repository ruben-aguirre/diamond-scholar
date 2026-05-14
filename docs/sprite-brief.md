# Diamond Scholar — Batter Swing Sprite Brief

**Prepared for:** Pixel artist
**Prepared by:** Ruben Aguirre, 8 SIGNAL
**Contact:** ruben@8signal.com
**Last updated:** May 2026

---

## Project Overview

I'm building a kids' baseball learning game called **Diamond Scholar**. Players answer study questions to earn the chance to swing at pitches. The game runs in a web browser (HTML5 canvas) and on phones as a PWA. The art style is friendly, kid-appropriate, and inspired by **Baseball 9** and **Half-Yard Baseball** — chibi proportions, clean lines, bright colors.

I need a **batter character with an 8-frame swing animation** delivered as pixel-art sprites.

---

## Deliverables

1. **One base character reference sheet** showing the batter from the back-3/4 view (stance pose), at full resolution, with any visible color palette / construction notes you'd use.
2. **An 8-frame swing animation** as either:
   - **8 individual PNGs** (preferred — easier to swap programmatically), OR
   - **A horizontal sprite sheet** (8 frames in a row, single PNG)
3. **Source file** (Aseprite `.aseprite`, Photoshop `.psd`, or whatever you use) so I can request edits later without starting over.
4. **A color palette swatch** (PNG or hex list) — I want to be able to recolor the jersey/helmet per team in code by tinting, so the base sprite should use a palette I can shift.

---

## Technical Specs

| Spec | Value |
|---|---|
| Frame size | **128×128, 192×192, or 256×256** — your call based on your workflow. Anything in that range works for our render size. |
| Frame count | **8** |
| File format | PNG with **transparent background** |
| Color depth | 32-bit RGBA |
| Style | **Pixel art** (no anti-aliasing on the character edges — clean stair-stepped pixels) |
| Pivot point | Feet anchored at the same pixel coordinate in every frame |
| Outline style | Clean **black or near-black outline** around the character (1-2 pixel weight), consistent across frames |

**Important:** the character must NOT drift across frames. Hips and feet stay anchored at the same pixel position; only the body rotates, weight shifts, and limbs move. When the frames cycle, it should look like a single character swinging in place — not walking across the screen.

---

## Camera Angle

**Catcher-cam.** The camera is positioned behind home plate looking out toward the pitcher in the distance. The batter is in the foreground, standing in the **left batter's box** (3rd-base side, right-handed batter).

- At **stance** (frame 1), we see his **back-right side** — about 60% back, 40% front. His face/cheek/one eye is visible on the front-left of his helmet (the side facing the pitcher). His back is angled away from us.
- Over the course of the swing, his **whole body rotates ~90° clockwise** (from camera POV).
- By **frame 8** (finish), we see his **full back** — the jersey number "9" is centered on his back facing the camera.

Think Baseball 9's batter view, not a side-view arcade baseball game.

---

## Character Design

**Style:** Chibi pixel art. Big head (~1/3 of total body height), short chunky limbs, wide athletic stance.

### Helmet

- Royal blue (`#1F3A93`), glossy plastic look — show with cel-shaded highlights
- Short flat front bill/brim
- Ear flap covering the ear on the pitcher-facing side
- Small white logo dot or star on the front center
- Lighter blue highlight on the upper-front, darker blue shadow on the back curve

### Face (visible only in early frames, hidden by frame 4-5)

- Warm tan skin tone (`#E7B691`)
- Single dark dot eye (chibi style — no full eyes, just an expressive dot)
- Small focused expression — slight mouth line optional, no teeth
- Cheek shadow under the helmet ear flap

### Jersey

- Royal blue (`#1F3A93`), short-sleeved, button-up baseball style
- **Front:** small white wordmark "TEAM" across the chest (placeholder — will be team-swappable in code, so keep it as a single readable area I can mask/replace)
- **Back:** large bold white **"9"** with thick black outline, centered between the shoulder blades
- Subtle darker-blue cel-shading on the shaded side

### Pants

- Cream-white classic baseball pants (`#F5F1E8`)
- Slightly baggy chibi cut
- Black belt at the waist
- Optional thin blue pinstripe down the outer leg

### Cleats

- Black athletic cleats with white sole detail
- Both feet visible in the wide planted stance

### Bat

- Standard wooden bat, light tan wood (`#C9A36B`)
- Darker grain shadow on the underside (`#8B5E34`)
- Black grip tape wrapped at the handle
- Small round knob at the base
- Both hands stacked on the grip
- Always visible across all frames, in proportion (not foreshortened weirdly — pixel art handles foreshortening with discrete pose changes, not scaling)

### Lighting / Shading

- Single key light from upper-right
- **Cel-shaded** — hard-edged shadow regions, no smooth gradients
- 3 tones per surface (light / mid / dark)

---

## The 8 Frames

The batter starts in stance, loads, strides, drives through contact, and finishes in full follow-through. His body rotates ~90° clockwise across the sequence. The camera and his feet don't move; everything else does.

### Frame 1 — Stance (Ready)

- Body in back-3/4 view, ~60% back / 40% front visible
- Bat cocked over the right shoulder, tilted ~20° back from vertical
- Both hands stacked on the grip near the right ear
- Knees slightly bent, weight balanced, feet shoulder-width apart
- Head turned toward the pitcher — face/cheek/eye visible on left side of helmet
- Calm, ready expression

### Frame 2 — Load (Coil)

- Slight weight shift back onto the back leg
- Hands draw back another few pixels toward the back shoulder
- Bat tips back another 5-10°, closer to vertical
- Front shoulder closes slightly inward (toward the camera)
- Front knee may lift just a touch, getting ready to stride
- Face still visible, same expression

### Frame 3 — Stride (Foot Plant)

- Front foot has stepped forward and just planted in a new position
- Hips begin to rotate open toward the pitcher (visible: belt line angles forward)
- **Hands and bat are STILL back** — this is the key "separation" pose that creates bat speed in real baseball. The lower body has moved, the upper body has not yet.
- Body is now ~25% rotated from stance
- Face partially obscured by the helmet edge as the head starts to turn

### Frame 4 — Initiation (Hands Drop)

- Hands drop and start moving forward toward the strike zone
- Hips fully rotated open; shoulders just beginning to follow
- Bat angle drops from cocked-vertical to about 45° — the barrel falls into the slot
- Body is now ~45% rotated; mostly right-side visible
- Face nearly hidden behind helmet edge — only a sliver visible

### Frame 5 — Contact (THE MONEY FRAME)

- Bat is **horizontal**, fully extended forward through the strike zone, pointing toward the pitcher
- Hands are extended out in front of the body, arms nearly straight
- Hips fully open, shoulders fully rotated through
- Front leg is firm and straight; back leg has bent at the knee with the **back foot up on the toe, heel raised** (the classic squashed-bug back foot)
- Body is now ~65% rotated — we see his right side and a sliver of back
- Helmet has rotated with the body; **face no longer visible**
- This frame should look **explosive** — like the bat is meeting the ball. The most important frame of the eight.

### Frame 6 — Extension (Power Through)

- Arms fully extended forward, hands past the lead shoulder
- Bat sweeping past horizontal, now angled slightly down-and-forward toward 1st base direction
- Body continues rotating — we now see ~75% back
- Jersey number "9" starts coming into view on the back
- Back foot fully on the toe, heel high
- This is the "after contact" pose — the bat has just passed through the zone

### Frame 7 — Wrap (Follow-Through Begins)

- Hands rising up and across the body toward the left shoulder
- Bat starts wrapping around — barrel is now pointing back behind the batter, on his left side
- We now see ~90% back; **full jersey number "9" visible** and readable
- Front foot still planted firm, back foot fully pivoted on the toe

### Frame 8 — Finish (Full Follow-Through)

- Bat **fully wrapped around the back**, barrel pointing down and behind the batter's left shoulder
- Hands held high, near the left ear
- Body fully rotated — we see his **complete back**, jersey number "9" centered and facing the camera
- Helmet turned with the body — we see the back of the helmet (no face)
- Slight forward weight on the front leg; back foot up on the toe
- Confident finish position — looks like he just crushed it

---

## How These Will Be Used

In code, I'll cycle through the 8 frames over ~400ms (so each frame shows for ~50ms). The animation will play whenever the user clicks "Swing!" during a pitch.

Frame 1 (stance) will also be the **default idle pose** displayed between pitches, so it needs to look good standing alone, not just as the start of an animation.

Frames 4-6 are the fastest-paced (the actual contact moment), so they should feel like distinct snapshots of a fast motion. Frames 7-8 (follow-through) settle a bit.

---

## What to Avoid

- **No anti-aliasing on the character outlines** — keep it true pixel art with crisp stair-stepped edges.
- **No drift across frames** — feet stay locked at the same pixel coordinate.
- **No motion blur baked into the sprite** — I'll add the swing trail in code.
- **No environment / background** — character only on transparent background.
- **No tiny details I can't see** — at this size, less is more. Big shapes, clear silhouette, readable from a phone screen.
- **Don't change the character's identity across frames** — same head shape, same jersey color, same proportions in every frame. This is the #1 thing that breaks sprite animation if it's wrong.

---

## Future Work (Not in This Brief, but Good to Know)

Down the road I may want:

- Idle pose with a slight breathing/bat-tapping cycle (4-6 frames)
- A "strikeout / sad" pose (1-2 frames)
- A "home run / celebrate" pose (4 frames)
- Recolor variants per team (or a recolor-friendly palette I can shift in code)
- Pitcher character with throw animation (similar 6-8 frame swing equivalent)

If you can build the base character in a layered/palette-swappable way, that'll save us both work later. Not required for this delivery, but appreciated.

---

## Budget & Timeline

*To be discussed.*

Pixel artists typically quote $30-150/frame for high-quality custom character animation, so 8 frames + a base reference could run $300-1,500 depending on the artist's level and turnaround. Open to discussing scope, milestones, or a fixed-price quote.

---

## Reference Images

To be sent separately alongside this brief:

- **Baseball 9 in-game screenshot** — target visual feel and camera angle
- **Current canvas-drawn batter screenshot** — "do NOT do this" reference (what we're replacing)

---

## Questions for the Artist Before Starting

1. What frame size do you prefer to work at — 128×128, 192×192, or 256×256?
2. Do you work in Aseprite, Photoshop, or something else? (I'd prefer Aseprite source if possible.)
3. Can you deliver a layered source file so I can request changes (recolor, helmet variant) later without redoing the whole animation?
4. What's your turnaround for 8 frames + a base character?
5. Any examples of comparable swing/action animations you've done before?

---

*Thanks for reading — looking forward to working with you.*
