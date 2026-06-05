import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GAME_PHASES,
  createGameState,
  generatePitch,
  pitchDurationMs,
  calculateSwingResult,
  advanceRunners,
  simulateAIHalfInningSteps,
  checkMercyRule,
  getTeamAverage,
} from '../game/GameEngine';
import StudyBreak from './StudyBreak';
import DidYouKnowCard from './DidYouKnowCard';
import scienceQuestions from '../data/questions/science-4th.json';

// Canvas internal drawing size
const CW = 800;
const CH = 500;

// Scene anchor points - CATCHER CAM PERSPECTIVE
// Camera sits behind home plate looking toward center field.
// Depth axis: far (small, high on screen) -> near (big, low on screen)
const MOUND = { x: 400, y: 270 };        // pitcher's mound, centered in middle distance
const PLATE = { x: 400, y: 475 };        // home plate, bottom center foreground
const BATTER = { x: 270, y: 478 };       // right-handed batter, LEFT batter's box; nudged right so wide stance fits fully inside chalk lines (x∈[140,340], y∈[430,490])
const ZONE = { cx: 400, cy: 440, w: 70, h: 70 }; // strike zone — knees to chest height (was up to the helmet before)

// Fielder home positions. Used both for drawing the idle fielders and for
// animating them to chase a hit ball (and slide back home after).
const SHORTSTOP_HOME = { x: 230, y: 245 };
const SECOND_BASE_HOME = { x: 570, y: 245 };
const FIELDER_SCALE = 0.75;

const SWING_TYPES = [
  { id: 'normal', label: 'Swing', color: '#3498db' },
  { id: 'power', label: 'Power', color: '#e67e22' },
  { id: 'bunt', label: 'Bunt', color: '#16a085' },
  { id: 'half', label: 'Half', color: '#8e44ad' },
];

function getRandomFact() {
  const facts = scienceQuestions.didYouKnow;
  return facts[Math.floor(Math.random() * facts.length)];
}

function getStudyQuestions(count = 5) {
  const pool = [...scienceQuestions.questions];
  const selected = [];
  while (selected.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }
  return selected;
}

// ---- Drawing helpers ----

// Outline color used consistently across characters for the "bold-line cartoon" look
const INK = '#1a1a1a';
const INK_WIDTH = 2.5;

function darken(hex, amount = 0.3) {
  if (!hex) return '#555';
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(c.substr(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.substr(2, 2), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.substr(4, 2), 16) * (1 - amount)));
  return `rgb(${r}, ${g}, ${b})`;
}

function lighten(hex, amount = 0.25) {
  if (!hex) return '#aaa';
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const r = Math.min(255, Math.round(parseInt(c.substr(0, 2), 16) + (255 - parseInt(c.substr(0, 2), 16)) * amount));
  const g = Math.min(255, Math.round(parseInt(c.substr(2, 2), 16) + (255 - parseInt(c.substr(2, 2), 16)) * amount));
  const b = Math.min(255, Math.round(parseInt(c.substr(4, 2), 16) + (255 - parseInt(c.substr(4, 2), 16)) * amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function inkStroke(ctx, width = INK_WIDTH) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

function outlinedCircle(ctx, x, y, r, fillColor, strokeWidth = INK_WIDTH) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
  inkStroke(ctx, strokeWidth);
}

function outlinedRect(ctx, x, y, w, h, fillColor, strokeWidth = INK_WIDTH) {
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = INK;
  ctx.lineWidth = strokeWidth;
  ctx.strokeRect(x, y, w, h);
}

function outlinedPath(ctx, drawPath, fillColor, strokeWidth = INK_WIDTH) {
  ctx.beginPath();
  drawPath(ctx);
  ctx.fillStyle = fillColor;
  ctx.fill();
  inkStroke(ctx, strokeWidth);
}

// ---- Drawing ----

function drawSky(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, CH * 0.6);
  grad.addColorStop(0, '#7CC6FF');
  grad.addColorStop(1, '#C8ECFF');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH * 0.6);
  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  [[120, 70, 55], [380, 55, 45], [640, 90, 60]].forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.7, y + 4, r * 0.8, 0, Math.PI * 2);
    ctx.arc(x - r * 0.7, y + 6, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawOutfield(ctx) {
  // Stadium wraps behind the field. Curved wall reads as "we're inside a stadium"
  // rather than "we're in a 2D level." Higher on the sides, dips in the center
  // where the camera's axis meets center field.

  // Upper-deck shadow (pitched roofline that curves toward center)
  ctx.fillStyle = '#2a3447';
  ctx.beginPath();
  ctx.moveTo(0, 140);
  ctx.quadraticCurveTo(CW / 2, 200, CW, 140);
  ctx.lineTo(CW, 185);
  ctx.quadraticCurveTo(CW / 2, 240, 0, 185);
  ctx.closePath();
  ctx.fill();

  // Light tower dots across roofline
  ctx.fillStyle = '#f1c40f';
  [80, 220, 360, 500, 640, 720].forEach((tx, i) => {
    const ty = 155 + Math.abs((tx - CW / 2)) * -0.05 + 20;
    ctx.beginPath();
    ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // (The big jumbotron scoreboard is drawn separately by drawJumbotron so it
  // can read live game state — see the render loop.)

  // Bleacher crowd band - curved to match the wraparound feel
  // Draw as a band that dips in the middle
  ctx.fillStyle = '#7a6a55';
  ctx.beginPath();
  ctx.moveTo(0, 195);
  ctx.quadraticCurveTo(CW / 2, 230, CW, 195);
  ctx.lineTo(CW, 225);
  ctx.quadraticCurveTo(CW / 2, 260, 0, 225);
  ctx.closePath();
  ctx.fill();

  // Crowd speckle (deterministic positions so they don't flicker between frames)
  const crowdColors = ['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1', '#9b59b6', '#27ae60'];
  for (let i = 0; i < 220; i++) {
    const tx = (i * 37) % CW;
    const centerOffset = (tx - CW / 2);
    const curveDip = 30 - Math.abs(centerOffset * 0.05);
    const ty = 205 + (i * 13) % 25 - curveDip * 0.3;
    ctx.fillStyle = crowdColors[i % crowdColors.length];
    ctx.fillRect(tx, ty, 2.5, 2.5);
  }

  // Outfield wall (green, curved - higher edges, lower center)
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.moveTo(0, 230);
  ctx.quadraticCurveTo(CW / 2, 265, CW, 230);
  ctx.lineTo(CW, 270);
  ctx.quadraticCurveTo(CW / 2, 305, 0, 270);
  ctx.closePath();
  ctx.fill();

  // Yellow padded top rail on the wall
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  ctx.moveTo(0, 230);
  ctx.quadraticCurveTo(CW / 2, 265, CW, 230);
  ctx.lineTo(CW, 234);
  ctx.quadraticCurveTo(CW / 2, 269, 0, 234);
  ctx.closePath();
  ctx.fill();

  // Outfield grass - fills from wall down, gets brighter toward foreground
  const grad = ctx.createLinearGradient(0, 270, 0, CH);
  grad.addColorStop(0, '#4FA53A');       // darker far
  grad.addColorStop(0.5, '#5DBB4A');     // mid
  grad.addColorStop(1, '#6DCF52');       // brighter near
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 270);
  ctx.quadraticCurveTo(CW / 2, 305, CW, 270);
  ctx.lineTo(CW, CH);
  ctx.lineTo(0, CH);
  ctx.closePath();
  ctx.fill();

  // Mowed grass stripes - curve slightly to follow the field (perspective cue)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 7; i++) {
    if (i % 2 === 0) continue;
    const stripeY = 285 + i * 28;
    ctx.beginPath();
    ctx.moveTo(0, stripeY);
    ctx.quadraticCurveTo(CW / 2, stripeY + 15, CW, stripeY);
    ctx.lineTo(CW, stripeY + 16);
    ctx.quadraticCurveTo(CW / 2, stripeY + 31, 0, stripeY + 16);
    ctx.closePath();
    ctx.fill();
  }
}

// Big stadium jumbotron mounted above the outfield wall. Shows live game
// state — scores, inning, balls/strikes/outs count, and base runners — so the
// player can read the whole situation at a glance. Replaces the tiny corner
// diamond that used to get hidden behind the clouds.
function drawJumbotron(ctx, game, teamNameShort) {
  // Panel geometry — wide, centered, sitting above the green outfield wall.
  const pw = 340;          // panel width
  const ph = 104;          // panel height
  const px = CW / 2 - pw / 2;
  const py = 96;
  const pad = 18;          // inner padding from panel edges

  ctx.save();

  // ---- Support struts (so it reads as "mounted on the wall") ----
  ctx.fillStyle = '#2a2f38';
  ctx.fillRect(px + 40, py + ph, 10, 30);
  ctx.fillRect(px + pw - 50, py + ph, 10, 30);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 40, py + ph, 10, 30);
  ctx.strokeRect(px + pw - 50, py + ph, 10, 30);

  // ---- Outer frame ----
  ctx.fillStyle = '#11151c';
  ctx.fillRect(px - 5, py - 5, pw + 10, ph + 10);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(px - 5, py - 5, pw + 10, ph + 10);

  // ---- LED screen background ----
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(px, py, pw, ph);
  // Faint scanline texture for the "LED screen" feel
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let sy = py + 2; sy < py + ph; sy += 4) {
    ctx.fillRect(px, sy, pw, 1);
  }

  // ---- Helpers ----
  const amber = '#FFB627';
  const green = '#3DDC55';
  const red = '#FF5050';
  const dim = 'rgba(255,255,255,0.18)';

  // ---- TOP ROW: team names + scores ----
  // Layout: [HOME label .... score]  |  [OPP label .... score]
  // Two equal halves split at the panel's vertical centerline. Labels are
  // left-aligned at the half's inner edge; scores are right-aligned at the
  // half's outer edge, with padding so nothing touches the frame.
  //
  // Team-name abbreviation: real scoreboards use the team nickname, not the
  // city. "Blue Jays" → "JAYS", "Red Sox" → "SOX". For multi-word names take
  // the last word; for a single word, keep it (truncated only if very long).
  const rawName = (teamNameShort || 'HOME').trim();
  const words = rawName.split(/\s+/);
  const homeLabel = (words.length > 1 ? words[words.length - 1] : words[0])
    .toUpperCase()
    .substring(0, 8);
  const rowY = py + 21;
  const midX = px + pw / 2;

  ctx.textBaseline = 'middle';

  // Home (player) — label on the far left, score just left of centerline
  ctx.textAlign = 'left';
  ctx.fillStyle = amber;
  ctx.font = 'bold 14px Fredoka, sans-serif';
  ctx.fillText(homeLabel, px + pad, rowY);
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px Fredoka, sans-serif';
  ctx.fillStyle = green;
  ctx.fillText(String(game.playerScore), midX - 14, rowY);

  // Away (opponent) — label just right of centerline, score on the far right
  ctx.textAlign = 'left';
  ctx.fillStyle = amber;
  ctx.font = 'bold 14px Fredoka, sans-serif';
  ctx.fillText('OPP', midX + 14, rowY);
  ctx.textAlign = 'right';
  ctx.font = 'bold 22px Fredoka, sans-serif';
  ctx.fillStyle = green;
  ctx.fillText(String(game.aiScore), px + pw - pad, rowY);

  // Center divider between the two team halves
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(midX, py + 6);
  ctx.lineTo(midX, py + 34);
  ctx.stroke();

  // Horizontal divider under the score row
  ctx.beginPath();
  ctx.moveTo(px + 10, py + 38);
  ctx.lineTo(px + pw - 10, py + 38);
  ctx.stroke();

  // ---- MIDDLE: inning indicator (centered) ----
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Fredoka, sans-serif';
  const halfArrow = game.isTopHalf ? '▲' : '▼';  // ▲ top / ▼ bottom
  ctx.fillText(`${halfArrow} INNING ${game.inning} / 3`, CW / 2, py + 50);

  // ---- BOTTOM-LEFT: B / S / O count as LED dot rows ----
  const countX = px + pad;
  let countRowY = py + 60;
  const drawDotRow = (label, filled, total, onColor) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = amber;
    ctx.font = 'bold 11px Fredoka, sans-serif';
    ctx.fillText(label, countX, countRowY);
    for (let i = 0; i < total; i++) {
      ctx.beginPath();
      ctx.arc(countX + 20 + i * 13, countRowY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = i < filled ? onColor : dim;
      ctx.fill();
    }
    countRowY += 14;
  };
  drawDotRow('B', game.balls, 4, green);
  drawDotRow('S', game.strikes, 3, amber);
  drawDotRow('O', game.outs, 3, red);

  // ---- BOTTOM-RIGHT: base runners diamond ----
  // Pulled in from the right edge with enough room for the rotated base
  // squares (~7px past the diamond half-size) so nothing clips the frame.
  const ds = 15;  // diamond half-size
  const dCx = px + pw - pad - ds - 8;
  const dCy = py + 74;
  // base positions: [1st, 2nd, 3rd]
  const basePts = [
    [dCx + ds, dCy],       // 1st (right)
    [dCx, dCy - ds],       // 2nd (top)
    [dCx - ds, dCy],       // 3rd (left)
  ];
  // home plate marker (small, just a reference point)
  ctx.fillStyle = dim;
  ctx.beginPath();
  ctx.arc(dCx, dCy + ds, 3, 0, Math.PI * 2);
  ctx.fill();
  // base squares — rotated 45° so they read as diamonds
  for (let i = 0; i < 3; i++) {
    const [bx, by] = basePts[i];
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = game.bases[i] ? green : dim;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.strokeStyle = game.bases[i] ? '#fff' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-5, -5, 10, 10);
    ctx.restore();
  }

  ctx.restore();
}

function drawInfield(ctx) {
  // Infield dirt - big foreground wedge that fans out toward the camera (lower = wider)
  ctx.fillStyle = '#D2A06B';
  ctx.beginPath();
  ctx.moveTo(260, 305);                    // far-left edge near outfield
  ctx.quadraticCurveTo(400, 340, 540, 305); // arc across back of infield
  ctx.lineTo(760, CH);                      // bottom-right corner (close to camera)
  ctx.lineTo(40, CH);                       // bottom-left corner
  ctx.closePath();
  ctx.fill();

  // Foul lines - chalk lines converging toward home plate = perspective cues
  ctx.strokeStyle = '#F5F1E8';
  ctx.lineWidth = 3;
  // Third-base line (from plate to left outfield)
  ctx.beginPath();
  ctx.moveTo(PLATE.x - 10, PLATE.y - 4);
  ctx.lineTo(40, CH);
  ctx.stroke();
  // First-base line (from plate to right outfield) - obscured by batter later
  ctx.beginPath();
  ctx.moveTo(PLATE.x + 10, PLATE.y - 4);
  ctx.lineTo(760, CH);
  ctx.stroke();

  // Pitcher's mound - small because it's far (perspective)
  ctx.fillStyle = '#C08B5C';
  ctx.beginPath();
  ctx.ellipse(MOUND.x, MOUND.y + 18, 55, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Mound rubber (white strip on top)
  ctx.fillStyle = '#F5F1E8';
  ctx.fillRect(MOUND.x - 10, MOUND.y + 15, 20, 3);

  // Batter's box (chalk outline to the LEFT of home plate where right-handed batter stands)
  ctx.strokeStyle = 'rgba(245, 241, 232, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(160, 430);     // far-left corner of box
  ctx.lineTo(305, 430);     // far-right corner (closer to plate)
  ctx.lineTo(340, 490);     // near-right corner (perspective)
  ctx.lineTo(140, 490);     // near-left corner (perspective)
  ctx.closePath();
  ctx.stroke();

  // Home plate - pentagon, larger than before because it's close to camera
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PLATE.x - 42, PLATE.y - 14);   // back-left corner
  ctx.lineTo(PLATE.x + 42, PLATE.y - 14);   // back-right corner
  ctx.lineTo(PLATE.x + 48, PLATE.y + 2);    // mid-right
  ctx.lineTo(PLATE.x, PLATE.y + 18);        // point toward camera
  ctx.lineTo(PLATE.x - 48, PLATE.y + 2);    // mid-left
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawStrikeZone(ctx) {
  // Strike zone is the vertical "box" floating above home plate where the ball
  // needs to pass through. In catcher cam it reads as a semi-transparent target
  // plane hovering in mid-scene.
  const x = ZONE.cx - ZONE.w / 2;
  const y = ZONE.cy - ZONE.h / 2;
  ctx.save();
  // Soft fill so it feels like a target zone, not a drawn-on wall
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(x, y, ZONE.w, ZONE.h);
  // Dashed bold outline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x, y, ZONE.w, ZONE.h);
  // Center crosshair
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ZONE.cx - 6, ZONE.cy);
  ctx.lineTo(ZONE.cx + 6, ZONE.cy);
  ctx.moveTo(ZONE.cx, ZONE.cy - 6);
  ctx.lineTo(ZONE.cx, ZONE.cy + 6);
  ctx.stroke();
  ctx.restore();
}

function drawPitcher(ctx, teamColor) {
  // Catcher-cam view: pitcher is SMALL (far away on the mound), facing the camera
  // head-on. We see his front, not his profile. Mid-windup pose: glove up,
  // throwing arm back.
  // Lifted 14px above MOUND.y so his feet land ON the dirt mound, not buried in it.
  const x = MOUND.x;
  const y = MOUND.y - 14;
  const jersey = '#c0392b';              // opponent jersey (red - contrasts with our team colors)
  const jerseyDark = darken(jersey, 0.35);
  const pants = '#F5F1E8';
  const pantsDark = darken(pants, 0.2);
  const skin = '#F2C8A0';

  // Legs (planted stance, both facing camera) — longer legs so the pitcher
  // looks like a real person and not a torso-on-cleats.
  // Right leg (from viewer's perspective)
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 1, y + 4);
    c.lineTo(x + 9, y + 4);
    c.lineTo(x + 11, y + 34);
    c.lineTo(x + 3, y + 34);
    c.closePath();
  }, pants);
  outlinedRect(ctx, x + 1, y + 32, 12, 4, INK);

  // Left leg
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 9, y + 4);
    c.lineTo(x - 1, y + 4);
    c.lineTo(x - 3, y + 34);
    c.lineTo(x - 11, y + 34);
    c.closePath();
  }, pants);
  outlinedRect(ctx, x - 13, y + 32, 12, 4, INK);

  // Belt
  outlinedRect(ctx, x - 11, y + 2, 22, 3, INK);

  // Torso (facing camera)
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 12, y - 14);
    c.lineTo(x + 12, y - 14);
    c.lineTo(x + 11, y + 4);
    c.lineTo(x - 11, y + 4);
    c.closePath();
  }, jersey);
  // Shadow stripe down the left side (cel shading)
  ctx.fillStyle = jerseyDark;
  ctx.fillRect(x - 12, y - 14, 4, 18);

  // Glove arm (raised/out, glove in front of chest - mid-windup)
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 12, y - 12);
    c.lineTo(x - 5, y - 14);
    c.lineTo(x - 2, y - 4);
    c.lineTo(x - 10, y - 2);
    c.closePath();
  }, jersey);
  // Glove (in front of torso, center)
  outlinedCircle(ctx, x - 4, y - 4, 5, '#6b4a2b');
  outlinedCircle(ctx, x - 4, y - 4, 2, '#4e3420');

  // Throwing arm (cocked back - up and to the right from camera view)
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 8, y - 14);
    c.lineTo(x + 14, y - 12);
    c.lineTo(x + 20, y - 22);
    c.lineTo(x + 14, y - 24);
    c.closePath();
  }, jersey);
  // Throwing hand (small circle - holding ball)
  outlinedCircle(ctx, x + 17, y - 23, 3, skin);

  // Head (facing camera)
  outlinedCircle(ctx, x, y - 22, 8, skin);

  // Cap (crown + brim, seen from the front)
  outlinedPath(ctx, (c) => {
    c.arc(x, y - 26, 8, Math.PI, Math.PI * 2);
    c.lineTo(x + 8, y - 23);
    c.lineTo(x - 8, y - 23);
    c.closePath();
  }, jersey);
  // Brim (front, wider than crown)
  outlinedRect(ctx, x - 10, y - 23, 20, 3, jerseyDark);

  // Simple face: two eye dots (bold-line cartoon style)
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x - 3, y - 20, 1.3, 0, Math.PI * 2);
  ctx.arc(x + 3, y - 20, 1.3, 0, Math.PI * 2);
  ctx.fill();
}

// Generic fielder — same proportions as the pitcher but in a "ready" stance
// (glove down by the waist instead of mid-windup). Used for the infielders
// (shortstop, second baseman) so the field looks populated. Same opponent
// jersey color so all defenders read as the same team.
//
// `scale` (default 1) shrinks the fielder for perspective — fielders that
// sit deeper in the field should be smaller than the pitcher.
function drawFielder(ctx, x, y, scale = 1) {
  if (scale !== 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
  }
  drawFielderBody(ctx, x, y);
  if (scale !== 1) {
    ctx.restore();
  }
}

function drawFielderBody(ctx, x, y) {
  const jersey = '#c0392b';              // opponent jersey (red)
  const jerseyDark = darken(jersey, 0.35);
  const pants = '#F5F1E8';
  const pantsDark = darken(pants, 0.2);
  const skin = '#F2C8A0';
  void pantsDark;  // (kept for visual parity with drawPitcher; not used here)

  // Legs (planted ready-stance, slightly wider than the pitcher's stance) —
  // longer legs so fielders look like real people, not torsos on cleats.
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 2, y + 4);
    c.lineTo(x + 10, y + 4);
    c.lineTo(x + 12, y + 34);
    c.lineTo(x + 4, y + 34);
    c.closePath();
  }, pants);
  outlinedRect(ctx, x + 2, y + 32, 12, 4, INK);

  outlinedPath(ctx, (c) => {
    c.moveTo(x - 10, y + 4);
    c.lineTo(x - 2, y + 4);
    c.lineTo(x - 4, y + 34);
    c.lineTo(x - 12, y + 34);
    c.closePath();
  }, pants);
  outlinedRect(ctx, x - 14, y + 32, 12, 4, INK);

  // Belt
  outlinedRect(ctx, x - 11, y + 2, 22, 3, INK);

  // Torso (facing camera)
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 12, y - 14);
    c.lineTo(x + 12, y - 14);
    c.lineTo(x + 11, y + 4);
    c.lineTo(x - 11, y + 4);
    c.closePath();
  }, jersey);
  // Side shadow
  ctx.fillStyle = jerseyDark;
  ctx.fillRect(x - 12, y - 14, 4, 18);

  // Glove arm — DOWN at the waist (ready position)
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 12, y - 10);
    c.lineTo(x - 6, y - 10);
    c.lineTo(x - 8, y + 4);
    c.lineTo(x - 14, y + 4);
    c.closePath();
  }, jersey);
  // Glove down by the side
  outlinedCircle(ctx, x - 11, y + 6, 5, '#6b4a2b');
  outlinedCircle(ctx, x - 11, y + 6, 2, '#4e3420');

  // Throwing arm — DOWN at the side (ready, not cocked)
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 6, y - 10);
    c.lineTo(x + 12, y - 10);
    c.lineTo(x + 14, y + 4);
    c.lineTo(x + 8, y + 4);
    c.closePath();
  }, jersey);
  // Throwing hand
  outlinedCircle(ctx, x + 11, y + 6, 2.5, skin);

  // Head
  outlinedCircle(ctx, x, y - 22, 8, skin);

  // Cap (crown + brim)
  outlinedPath(ctx, (c) => {
    c.arc(x, y - 26, 8, Math.PI, Math.PI * 2);
    c.lineTo(x + 8, y - 23);
    c.lineTo(x - 8, y - 23);
    c.closePath();
  }, jersey);
  outlinedRect(ctx, x - 10, y - 23, 20, 3, jerseyDark);

  // Eyes
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x - 3, y - 20, 1.3, 0, Math.PI * 2);
  ctx.arc(x + 3, y - 20, 1.3, 0, Math.PI * 2);
  ctx.fill();
}

// =============================================================================
// CHIBI BACK-3/4 BATTER — Baseball-9 style camera (behind home plate, looking
// at the pitcher in the distance). Right-handed batter standing in the LEFT
// batter's box.
//
// Pre-swing: we see his back-right side (~25% front visible at the helmet, the
// rest is back+right shoulder). The bat is cocked vertically over his right
// shoulder. As he swings, his whole body rotates ~90° clockwise (camera POV) —
// front shoulder pulls back toward 3rd base, back shoulder drives toward 1st.
// At extension we see his full back; the jersey number "9" rotates into view.
//
// We model this as THREE keyframes (Stance, Contact, Extension) interpolated
// over swing progress t∈[0,1]. Each keyframe stores: body rotation, hand
// position, bat angle, and a torso-twist factor that controls how much of the
// front vs. back of the batter is visible (0 = all back, 1 = some front).
// =============================================================================

function lerp(a, b, k) { return a + (b - a) * k; }
function easeOut(k) { return 1 - (1 - k) * (1 - k); }

// Three keyframes. All offsets are relative to BATTER (x, y).
// frontFactor: 0 = pure back view, 1 = some front-right visible (helmet face,
// chest stripe). At stance we still see a bit of front; at extension we see only back.
const SWING_KEYFRAMES = {
  stance: {
    bodyRot: 0,           // body rotation (rad) around hips, + = clockwise from camera
    frontFactor: 0.40,    // we see some front-right of the body
    handsX: 26, handsY: -48,    // hands behind right shoulder
    batAngle: -Math.PI * 0.38,  // bat cocked back over right shoulder (not straight up)
    batLen: 1.0,
    headTwist: -0.15,     // head turned slightly toward pitcher (left)
    leadFootDX: -28,      // front (left) foot toward pitcher — wide stance
    backFootDX: 28,       // back (right) foot away from pitcher
    hipShift: 0,
  },
  contact: {
    bodyRot: 0.55,        // body has rotated ~32° clockwise
    frontFactor: 0.10,    // mostly back now, just sliver of front
    handsX: -28, handsY: -42,
    batAngle: -Math.PI * 1.02,  // bat horizontal, pointing left toward pitcher
    batLen: 0.55,         // FORESHORTENED — barrel is pointing into the screen
    headTwist: -0.05,     // head still tracks ball
    leadFootDX: -32,      // front foot stepped forward
    backFootDX: 22,       // back foot pivoting inward
    hipShift: -3,         // hips driven toward pitcher
  },
  extension: {
    bodyRot: 1.0,         // body fully turned, we see full back
    frontFactor: 0.0,     // pure back view, jersey "9" facing camera
    handsX: -38, handsY: -68,  // hands wrapped up over left shoulder
    batAngle: -Math.PI * 1.55,  // bat wrapped pointing down-and-back behind left side
    batLen: 0.95,         // back to mostly full length (now visible side-on again)
    headTwist: 0.20,      // head following the swing through
    leadFootDX: -32,
    backFootDX: 14,       // back foot turned, on toe
    hipShift: -2,
  },
};

function swingPoseAt(t) {
  if (t <= 0) return { ...SWING_KEYFRAMES.stance };
  if (t >= 1) return { ...SWING_KEYFRAMES.extension };

  const kf = SWING_KEYFRAMES;
  let from, to, k;
  if (t < 0.50) {
    // Stance → Contact (load + drive). Slow load, snappy drive.
    const u = t / 0.50;
    from = kf.stance; to = kf.contact;
    k = u < 0.4 ? u * 0.5 : 0.20 + (u - 0.4) * 1.33;  // slow first 40%, fast next 60%
    k = Math.min(1, k);
  } else {
    // Contact → Extension (follow-through). Ease-out.
    const u = (t - 0.50) / 0.50;
    from = kf.contact; to = kf.extension;
    k = easeOut(u);
  }

  return {
    bodyRot: lerp(from.bodyRot, to.bodyRot, k),
    frontFactor: lerp(from.frontFactor, to.frontFactor, k),
    handsX: lerp(from.handsX, to.handsX, k),
    handsY: lerp(from.handsY, to.handsY, k),
    batAngle: lerp(from.batAngle, to.batAngle, k),
    batLen: lerp(from.batLen, to.batLen, k),
    headTwist: lerp(from.headTwist, to.headTwist, k),
    leadFootDX: lerp(from.leadFootDX, to.leadFootDX, k),
    backFootDX: lerp(from.backFootDX, to.backFootDX, k),
    hipShift: lerp(from.hipShift, to.hipShift, k),
  };
}

// Bat tip position for the swing-trail effect.
function swingTipAt(x, y, t) {
  const p = swingPoseAt(t);
  const handsX = x + p.handsX + p.hipShift;
  const handsY = y + p.handsY;
  const len = 78 * p.batLen;
  return {
    x: handsX + Math.cos(p.batAngle) * len,
    y: handsY + Math.sin(p.batAngle) * len,
  };
}

function drawBatter(ctx, teamColor, batSwingT, teamNameShort) {
  const x = BATTER.x;
  const y = BATTER.y;
  const t = batSwingT == null ? 0 : batSwingT;
  const pose = swingPoseAt(t);

  const jersey = teamColor || '#1f3a93';
  const jerseyDark = darken(jersey, 0.35);
  const jerseyLight = lighten(jersey, 0.20);
  const pants = '#F5F1E8';
  const pantsDark = darken(pants, 0.18);
  const skin = '#E7B691';
  const skinDark = darken(skin, 0.18);
  const helmet = jersey;
  const helmetDark = jerseyDark;
  const helmetLight = jerseyLight;

  const front = pose.frontFactor;       // 0 = pure back, 1 = some front
  const rot = pose.bodyRot;             // 0 = stance, 1 = extension
  const hx = pose.hipShift;             // horizontal hip shift toward pitcher

  // ---- LEGS (chibi: short and chunky, planted wide) ----
  // Lead leg = LEFT on screen (toward pitcher). Back leg = RIGHT.
  // During the swing the lead foot stays planted, the back foot pivots inward.
  const leadFX = x + pose.leadFootDX;
  const backFX = x + pose.backFootDX;
  const footY = y + 62;
  const kneeY = y + 30;

  // Back leg (drawn first so lead leg sits in front)
  outlinedPath(ctx, (c) => {
    c.moveTo(backFX - 11, footY - 4);
    c.lineTo(backFX + 13, footY - 4);
    c.lineTo(x + 10 + hx, kneeY);
    c.lineTo(x - 4 + hx, kneeY);
    c.closePath();
  }, pants);
  // Back leg shadow (right side)
  ctx.fillStyle = pantsDark;
  ctx.beginPath();
  ctx.moveTo(backFX + 8, footY - 4);
  ctx.lineTo(backFX + 13, footY - 4);
  ctx.lineTo(x + 10 + hx, kneeY);
  ctx.lineTo(x + 4 + hx, kneeY);
  ctx.closePath();
  ctx.fill();
  // Back cleat
  outlinedRect(ctx, backFX - 14, footY - 2, 30, 10, INK);

  // Lead leg
  outlinedPath(ctx, (c) => {
    c.moveTo(leadFX - 13, footY - 4);
    c.lineTo(leadFX + 11, footY - 4);
    c.lineTo(x + 4 + hx, kneeY);
    c.lineTo(x - 10 + hx, kneeY);
    c.closePath();
  }, pants);
  ctx.fillStyle = pantsDark;
  ctx.beginPath();
  ctx.moveTo(leadFX + 6, footY - 4);
  ctx.lineTo(leadFX + 11, footY - 4);
  ctx.lineTo(x + 4 + hx, kneeY);
  ctx.lineTo(x - 2 + hx, kneeY);
  ctx.closePath();
  ctx.fill();
  // Lead cleat
  outlinedRect(ctx, leadFX - 16, footY - 2, 30, 10, INK);

  // ---- HIPS / BELT ----
  outlinedRect(ctx, x - 26 + hx, y + 10, 52, 9, INK);

  // ---- TORSO (chibi: short, wide; rotates with bodyRot) ----
  // Width tapers from "wider front-3/4" (stance) to "narrower pure-back" (extension)
  // because we lose perspective width as he turns. Use rot to drive it.
  const torsoTopY = y - 44;
  const torsoBotY = y + 10;
  const torsoWide = lerp(36, 30, rot);   // shoulder half-width
  const torsoNarrow = lerp(28, 24, rot); // hip half-width

  outlinedPath(ctx, (c) => {
    c.moveTo(x - torsoWide + hx, torsoTopY);
    c.lineTo(x + torsoWide + hx, torsoTopY);
    c.lineTo(x + torsoNarrow + hx, torsoBotY);
    c.lineTo(x - torsoNarrow + hx, torsoBotY);
    c.closePath();
  }, jersey);

  // Torso shading: a dark vertical band on the FAR side (right when stance,
  // left when extension), and a light highlight band on the NEAR side. This
  // is what gives the chibi its 3D feel without true rendering.
  // At stance, front-right is lit (jerseyLight on right), back is dark.
  // At extension, the lighting flips because he's now seen from behind.
  // We approximate by interpolating the shadow x-position with rot.
  const shadowX = lerp(x - torsoWide * 0.9, x + torsoWide * 0.1, rot) + hx;
  ctx.fillStyle = jerseyDark;
  ctx.beginPath();
  ctx.moveTo(shadowX, torsoTopY);
  ctx.lineTo(shadowX + 10, torsoTopY);
  ctx.lineTo(shadowX + 8, torsoBotY);
  ctx.lineTo(shadowX - 2, torsoBotY);
  ctx.closePath();
  ctx.fill();

  // Highlight band (subtle)
  const highlightX = lerp(x + torsoWide * 0.4, x - torsoWide * 0.4, rot) + hx;
  ctx.fillStyle = jerseyLight;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(highlightX, torsoTopY + 4);
  ctx.lineTo(highlightX + 6, torsoTopY + 4);
  ctx.lineTo(highlightX + 4, torsoBotY - 4);
  ctx.lineTo(highlightX - 2, torsoBotY - 4);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // ---- JERSEY GRAPHIC ----
  // When front-facing (front > 0.2): show team name + small chest logo on front.
  // When back-facing (front < 0.3): show big jersey number on back.
  // Crossfade between them based on front.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (front > 0.05) {
    // Front-facing chest text (small team label)
    ctx.globalAlpha = front;
    ctx.fillStyle = '#F5F1E8';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.font = 'bold 10px Fredoka, sans-serif';
    const label = (teamNameShort || 'TEAM').toUpperCase().substring(0, 8);
    ctx.strokeText(label, x + hx, y - 28);
    ctx.fillText(label, x + hx, y - 28);
  }
  if (front < 0.5) {
    // Back-facing jersey number (big "9")
    ctx.globalAlpha = 1 - front * 1.5;
    if (ctx.globalAlpha > 0) {
      ctx.fillStyle = '#F5F1E8';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.font = 'bold 38px Fredoka, sans-serif';
      ctx.strokeText('9', x + hx, y - 16);
      ctx.fillText('9', x + hx, y - 16);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ---- ARMS ----
  // Both arms hold the bat. Right (back) arm is closer to camera at stance,
  // hidden behind torso at extension. Left (front) arm sweeps across the body.
  // We render them as simple sleeve-quads from shoulder to hands.
  const handsAbsX = x + pose.handsX + hx;
  const handsAbsY = y + pose.handsY;

  // Right shoulder anchor — moves toward the LEFT of the torso as body rotates
  // (because the right shoulder rotates around to where we now see his back)
  const rShoulderX = lerp(x + 28, x - 18, rot) + hx;
  const rShoulderY = torsoTopY + 4;
  // Left shoulder — moves the opposite way
  const lShoulderX = lerp(x - 22, x + 26, rot) + hx;
  const lShoulderY = torsoTopY + 4;

  // Back arm (right) — drawn first so front arm overlaps it
  outlinedPath(ctx, (c) => {
    c.moveTo(rShoulderX - 6, rShoulderY);
    c.lineTo(rShoulderX + 10, rShoulderY);
    const elbowX = (rShoulderX + handsAbsX) / 2 + 6;
    const elbowY = (rShoulderY + handsAbsY) / 2 - 2;
    c.lineTo(elbowX + 4, elbowY);
    c.lineTo(handsAbsX + 4, handsAbsY + 6);
    c.lineTo(handsAbsX - 6, handsAbsY + 6);
    c.lineTo(elbowX - 6, elbowY + 4);
    c.closePath();
  }, jerseyDark);

  // Front arm (left) — bright jersey
  outlinedPath(ctx, (c) => {
    c.moveTo(lShoulderX - 8, lShoulderY);
    c.lineTo(lShoulderX + 4, lShoulderY);
    const elbowX = (lShoulderX + handsAbsX) / 2;
    const elbowY = (lShoulderY + handsAbsY) / 2 + 4;
    c.lineTo(elbowX + 2, elbowY);
    c.lineTo(handsAbsX, handsAbsY + 4);
    c.lineTo(handsAbsX - 8, handsAbsY + 4);
    c.lineTo(elbowX - 4, elbowY + 4);
    c.closePath();
  }, jersey);

  // ---- HANDS (skin) ----
  outlinedCircle(ctx, handsAbsX, handsAbsY, 7, skin);
  outlinedCircle(ctx, handsAbsX + 4, handsAbsY - 2, 6, skin);

  // ---- HEAD + HELMET (chibi: oversized ~1.4× normal proportions) ----
  // Head sits above shoulders with a slight tilt that comes from headTwist.
  const headY = torsoTopY - 18;
  const headX = x + hx + Math.sin(pose.headTwist) * 6;
  const headR = 26;  // chibi: BIG head

  // Neck
  outlinedRect(ctx, headX - 8, torsoTopY - 4, 16, 8, skin);

  // Helmet base (full circle)
  outlinedCircle(ctx, headX, headY, headR, helmet);

  // Helmet shading: dark crescent on the BACK side of the helmet (away from
  // pitcher). At stance the back of the head is on the RIGHT side of the
  // helmet (camera sees back-right of batter, so helmet right edge = back).
  // As body rotates clockwise, the back rotates further around — at extension
  // we see his pure back, so the dark side is now on the LEFT of helmet
  // (back is now wrapped around to that side).
  // Arc goes from (start) to (end) clockwise, covering ~140° on the back.
  const helmetShadowStart = lerp(-Math.PI * 0.30, Math.PI * 0.70, rot);
  const helmetShadowEnd   = lerp(Math.PI * 0.50,  Math.PI * 1.50, rot);
  ctx.fillStyle = helmetDark;
  ctx.beginPath();
  ctx.arc(headX, headY, headR, helmetShadowStart, helmetShadowEnd);
  ctx.lineTo(headX, headY);
  ctx.closePath();
  ctx.fill();
  // Re-stroke helmet outline
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  inkStroke(ctx);

  // Helmet bill — flat ellipse on the FRONT of the helmet (pitcher-facing).
  // At stance, front-of-helmet = LEFT side of head (toward pitcher). Bill
  // angle migrates with body rotation as head turns through the swing.
  const billAngle = lerp(Math.PI * 0.95, Math.PI * 1.45, rot);
  const billCX = headX + Math.cos(billAngle) * (headR - 4);
  const billCY = headY + Math.sin(billAngle) * (headR - 4);
  ctx.save();
  ctx.translate(billCX, billCY);
  ctx.rotate(billAngle - Math.PI);  // bill points outward
  ctx.fillStyle = helmet;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Bill underside shadow
  ctx.fillStyle = helmetDark;
  ctx.beginPath();
  ctx.ellipse(0, 2, 13, 3, 0, 0, Math.PI);
  ctx.fill();
  ctx.restore();

  // Helmet highlight (small light circle on the LIT side — upper-front)
  ctx.fillStyle = helmetLight;
  ctx.globalAlpha = 0.7;
  const hlAngle = lerp(Math.PI * 1.20, Math.PI * 1.65, rot);
  const hlX = headX + Math.cos(hlAngle) * (headR * 0.55);
  const hlY = headY + Math.sin(hlAngle) * (headR * 0.55);
  ctx.beginPath();
  ctx.arc(hlX, hlY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // FACE — only visible while front > 0.10. The face is on the FRONT-LEFT of
  // the helmet (pitcher-facing side) at stance. We draw cheek + ear-flap +
  // single dot eye. As batter rotates, frontFactor → 0 fades it out.
  if (front > 0.10) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, front * 2.2);

    // Anchor face elements on the LEFT side of helmet (toward pitcher).
    // faceCX/faceCY = front-of-helmet point at the equator.
    const faceCX = headX - headR + 7;
    const faceCY = headY + 2;

    // Cheek (rounded protrusion on the front-left)
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(faceCX - 1, faceCY + 4, 8, Math.PI * 0.4, Math.PI * 1.6);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cheek shadow under the chin
    ctx.fillStyle = skinDark;
    ctx.beginPath();
    ctx.arc(faceCX - 1, faceCY + 8, 4, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();

    // Ear flap (jersey-color) covering the ear, sits on the helmet edge
    outlinedPath(ctx, (c) => {
      c.moveTo(faceCX + 6, faceCY - 8);
      c.lineTo(faceCX + 2, faceCY + 4);
      c.lineTo(faceCX + 8, faceCY + 12);
      c.lineTo(faceCX + 14, faceCY + 4);
      c.closePath();
    }, helmetDark);

    // Single eye dot (chibi style)
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(faceCX + 1, faceCY - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ---- BAT ----
  // Drawn AFTER body so it's on top. Bat is foreshortened during contact via batLen.
  ctx.save();
  ctx.translate(handsAbsX, handsAbsY);
  ctx.rotate(pose.batAngle);
  ctx.scale(pose.batLen, lerp(1.0, 1.3, 1 - pose.batLen));  // length shrinks, width grows when foreshortened

  // Bat shaft (tapered from grip to barrel)
  ctx.fillStyle = '#C9A36B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(50, -7);
  ctx.lineTo(78, -10);
  ctx.lineTo(78, 10);
  ctx.lineTo(50, 7);
  ctx.lineTo(0, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Wood grain shadow
  ctx.fillStyle = '#8B5E34';
  ctx.beginPath();
  ctx.moveTo(50, 2);
  ctx.lineTo(78, 4);
  ctx.lineTo(78, 10);
  ctx.lineTo(50, 7);
  ctx.closePath();
  ctx.fill();
  // Grip tape
  ctx.fillStyle = '#222';
  ctx.fillRect(0, -4, 14, 8);
  ctx.strokeRect(0, -4, 14, 8);
  // Knob
  ctx.beginPath();
  ctx.arc(-3, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#C9A36B';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // ---- SWING TRAIL (motion blur) ----
  if (batSwingT != null && batSwingT > 0.30 && batSwingT < 0.95) {
    ctx.save();
    const fade = batSwingT < 0.40 ? (batSwingT - 0.30) / 0.10
               : batSwingT > 0.85 ? (0.95 - batSwingT) / 0.10
               : 1;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.55 * fade})`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const samples = 10;
    const trailStart = Math.max(0.30, t - 0.22);
    for (let i = 0; i <= samples; i++) {
      const ts = trailStart + (t - trailStart) * (i / samples);
      const p = swingTipAt(x, y, ts);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawBall(ctx, x, y, size = 7) {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Stitching hint
  ctx.beginPath();
  ctx.arc(x, y, size - 2, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
}

function drawLandingMarker(ctx, targetX, targetY, strength) {
  // Glowing ring at predicted landing spot; strength grows as pitch nears plate
  ctx.save();
  const r = 10 + strength * 8;
  ctx.globalAlpha = 0.35 + strength * 0.45;
  ctx.strokeStyle = '#FFEA2B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(targetX, targetY, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#FFEA2B';
  ctx.beginPath();
  ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function computeLanding(pitch) {
  // pitch.x/y are normalized (-1..1 ≈ zone edge, outside = ball)
  return {
    x: ZONE.cx + pitch.x * (ZONE.w / 2),
    y: ZONE.cy + pitch.y * (ZONE.h / 2),
  };
}

function computeBallAt(pitch, t) {
  // Catcher cam: ball starts tiny at pitcher's release point (far away) and
  // grows dramatically as it approaches the camera. This is the key depth cue.
  const land = computeLanding(pitch);
  const sx = MOUND.x + 17;   // pitcher's throwing hand (cocked back)
  const sy = MOUND.y - 23;
  const x = sx + (land.x - sx) * t;
  // Slight arc so the pitch has some air
  const arc = Math.sin(t * Math.PI) * -20;
  const y = sy + (land.y - sy) * t + arc;
  // Ball size grows from 2px (far) to 14px (near) - strong perspective cue
  const size = 2.5 + t * 11;
  return { x, y, size, land };
}

// Build a hit-ball trajectory based on the swing result type. The ball flies
// from the contact point (near the strike zone) outward toward the field, on
// an arc that varies by hit type — grounders are flat, fly balls peak high,
// home runs sail over the wall, fouls go back over the batter.
//
// Returns: { kind, origin, target, peakY, duration }
//   origin: starting (x, y) at contact
//   target: ending (x, y) where the ball "lands" (or goes off-screen for HR)
//   peakY: minimum y the ball reaches at midflight (lower = higher arc)
function buildHitTrajectory(resultType) {
  // Contact point: just in front of and above home plate (where the strike
  // zone is — that's where the bat met the ball).
  const origin = { x: ZONE.cx, y: ZONE.cy + 5 };

  // Add a random horizontal spread so consecutive hits go to different places
  // — keeps the visual interesting.
  const spread = (Math.random() - 0.5) * 200;  // ±100px horizontal variation

  switch (resultType) {
    case 'homerun':
      return {
        kind: 'homerun',
        origin,
        target: { x: ZONE.cx + spread * 1.5, y: 100 },  // sails toward bleachers
        peakY: 70,                                      // very high arc
        duration: 1400,
      };
    case 'triple':
      return {
        kind: 'triple',
        origin,
        target: { x: ZONE.cx + spread * 1.4, y: 235 },  // deep outfield, near wall
        peakY: 160,
        duration: 1100,
      };
    case 'double':
      return {
        kind: 'double',
        origin,
        target: { x: ZONE.cx + spread * 1.2, y: 275 },  // outfield gap
        peakY: 200,
        duration: 950,
      };
    case 'single':
      return {
        kind: 'single',
        origin,
        target: { x: ZONE.cx + spread, y: 305 },        // shallow outfield / infield
        peakY: 280,                                     // line drive — lower arc
        duration: 800,
      };
    case 'flyout':
      return {
        kind: 'flyout',
        origin,
        target: { x: ZONE.cx + spread * 0.8, y: 290 },  // caught in outfield
        peakY: 150,                                     // high pop-up
        duration: 1100,
      };
    case 'groundout':
      return {
        kind: 'groundout',
        origin,
        target: { x: ZONE.cx + spread * 0.6, y: 360 },  // skips through infield
        peakY: 355,                                     // basically no arc — ground ball
        duration: 750,
      };
    case 'foul':
      return {
        kind: 'foul',
        // Foul goes back over the batter / behind home plate — off-screen
        // toward the camera (down + sideways).
        origin,
        target: { x: Math.random() < 0.5 ? -50 : CW + 50, y: CH + 50 },
        peakY: 300,
        duration: 700,
      };
    default:
      return {
        kind: 'single',
        origin,
        target: { x: ZONE.cx + spread, y: 305 },
        peakY: 280,
        duration: 800,
      };
  }
}

// Position of the hit ball at progress t∈[0,1]. Parabolic arc from origin to
// target, peaking at peakY at t=0.5.
function computeHitBallAt(traj, t) {
  const { origin, target, peakY } = traj;
  const x = origin.x + (target.x - origin.x) * t;
  // Quadratic Bezier-ish vertical motion: y(t) = (1-t)²·y0 + 2t(1-t)·yPeak + t²·y1
  // This gives a smooth arc that reaches peakY at t=0.5.
  const u = 1 - t;
  const y = u * u * origin.y + 2 * u * t * peakY + t * t * target.y;
  // Ball grows as it flies toward the camera (foreground), shrinks as it goes
  // deeper (background). y > 350 = foreground; y < 250 = deep.
  const depthFactor = Math.max(0, Math.min(1, (y - 230) / 220));
  const size = 4 + depthFactor * 8;
  return { x, y, size };
}

// Where a fielder ('ss' or '2b') should be drawn right now.
//   - No chase active OR this fielder isn't chasing → at home position
//   - Chase phase (now < chaseEnd) → moving from home toward the ball
//   - Return phase (chaseEnd ≤ now < returnEnd) → moving from ball back home
function computeFielderPos(who, chase, now) {
  const home = who === 'ss' ? SHORTSTOP_HOME : SECOND_BASE_HOME;
  if (!chase || chase.who !== who) return home;
  if (now < chase.chaseStart) return home;
  if (now < chase.chaseEnd) {
    // Chasing toward the ball
    const t = (now - chase.chaseStart) / (chase.chaseEnd - chase.chaseStart);
    // Ease-out so they sprint hard at first then ease into the catch
    const k = 1 - (1 - t) * (1 - t);
    return {
      x: home.x + (chase.target.x - home.x) * k,
      y: home.y + (chase.target.y - home.y) * k,
    };
  }
  if (now < chase.returnEnd) {
    // Jogging back to the home position
    const t = (now - chase.chaseEnd) / (chase.returnEnd - chase.chaseEnd);
    return {
      x: chase.target.x + (home.x - chase.target.x) * t,
      y: chase.target.y + (home.y - chase.target.y) * t,
    };
  }
  return home;
}

// =============================================================================
// BATTER SPRITE SYSTEM
// =============================================================================
// Plays an 8-frame swing animation from a single sprite sheet. The artist
// delivers one PNG containing all 8 frames in a horizontal strip; we slice
// the right frame each render.
//
// Sprite sheet contract:
//   public/sprites/batter/swing-sheet.png
//   2048 × 256 px (8 frames × 256 px wide, 256 px tall)
//   Transparent background, character anchored at the same feet position
//   in every frame.
//
// If the sheet fails to load, we fall back to a generated placeholder sheet
// (numbered rectangles) so the system stays testable. If the whole loader
// fails, the render loop falls back further to the math-based drawBatter().
//
// To swap in updated art: drop the new swing-sheet.png in place. That's it.
// =============================================================================

const SPRITE_FRAME_COUNT = 8;
const SPRITE_SOURCE_FRAME = 256;  // each frame is 256×256 in the source sheet
const SPRITE_DISPLAY_SIZE = 384;  // displayed size on canvas (square) — 2× the previous 192 so the chibi batter dominates the foreground like in Baseball 9
const SPRITE_SHEET_PATH = '/sprites/batter/swing-sheet.png';

// Generate a placeholder sprite sheet as a data-URL PNG. Eight numbered
// rectangles in a horizontal strip — obviously placeholders, but match the
// real sheet's layout so the slicing logic is exercised end-to-end.
function makePlaceholderSheet() {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = SPRITE_SOURCE_FRAME * SPRITE_FRAME_COUNT;
  c.height = SPRITE_SOURCE_FRAME;
  const x = c.getContext('2d');
  for (let i = 0; i < SPRITE_FRAME_COUNT; i++) {
    const fx = i * SPRITE_SOURCE_FRAME;
    // Frame backdrop
    x.fillStyle = 'rgba(0, 0, 0, 0.25)';
    x.fillRect(fx, 0, SPRITE_SOURCE_FRAME, SPRITE_SOURCE_FRAME);
    // Border
    x.strokeStyle = '#FFB627';
    x.lineWidth = 4;
    x.strokeRect(fx + 2, 2, SPRITE_SOURCE_FRAME - 4, SPRITE_SOURCE_FRAME - 4);
    // Big frame number
    x.fillStyle = '#FFB627';
    x.font = 'bold 128px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(String(i + 1), fx + SPRITE_SOURCE_FRAME / 2, SPRITE_SOURCE_FRAME / 2 - 12);
    x.font = 'bold 22px sans-serif';
    x.fillText('PLACEHOLDER', fx + SPRITE_SOURCE_FRAME / 2, SPRITE_SOURCE_FRAME / 2 + 76);
    // Feet-anchor tick at bottom-center
    x.fillStyle = '#FF5050';
    x.fillRect(fx + SPRITE_SOURCE_FRAME / 2 - 2, SPRITE_SOURCE_FRAME - 12, 4, 8);
  }
  return c.toDataURL('image/png');
}

// Preload the sprite sheet. Returns an object holding the loaded image, its
// natural dimensions, and whether we fell back to placeholders.
function loadBatterSprites() {
  const result = {
    sheet: null,                  // HTMLImageElement
    frameW: SPRITE_SOURCE_FRAME,  // source-rect width per frame (derived after load)
    frameH: SPRITE_SOURCE_FRAME,  // source-rect height per frame
    usingPlaceholders: false,
    ready: false,
  };
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      result.sheet = img;
      // Derive per-frame width from the actual sheet dimensions so future
      // re-sizes by the artist Just Work as long as it's still 8 frames wide.
      result.frameW = img.naturalWidth / SPRITE_FRAME_COUNT;
      result.frameH = img.naturalHeight;
      result.ready = true;
      resolve(result);
    };
    img.onerror = () => {
      // Real sheet missing — generate the placeholder strip.
      const placeholder = new Image();
      placeholder.src = makePlaceholderSheet();
      placeholder.onload = () => {
        result.sheet = placeholder;
        result.frameW = placeholder.naturalWidth / SPRITE_FRAME_COUNT;
        result.frameH = placeholder.naturalHeight;
        result.usingPlaceholders = true;
        result.ready = true;
        resolve(result);
      };
    };
    img.src = SPRITE_SHEET_PATH;
  });
}

// Pick which frame to display for a given swing progress t∈[0,1] (or null
// for idle). Idle shows frame 1 (stance). During the swing, frames advance
// linearly: t=0 → frame 1, t=1 → frame 8.
function pickSwingFrameIdx(t) {
  if (t == null || t <= 0) return 0;
  if (t >= 1) return SPRITE_FRAME_COUNT - 1;
  return Math.min(SPRITE_FRAME_COUNT - 1, Math.floor(t * SPRITE_FRAME_COUNT));
}

// Draw the batter by slicing one frame out of the sprite sheet. Anchored at
// the batter's feet so the character doesn't drift through the swing.
function drawBatterSprite(ctx, sprites, batSwingT) {
  if (!sprites || !sprites.sheet) return false;
  const idx = pickSwingFrameIdx(batSwingT);
  const sx = idx * sprites.frameW;
  const sy = 0;
  const sw = sprites.frameW;
  const sh = sprites.frameH;
  // Anchor: the batter's visible feet should land at (BATTER.x, BATTER.y).
  // The sprite has transparent margins around the visible character:
  //   ~14% below the feet (so feet are at y ≈ 0.86 × frameH within the sprite)
  //   character is offset slightly LEFT of frame center (~42% from the left)
  // We compute dx/dy so the FEET of the visible character — not the corner of
  // the transparent frame — land exactly at BATTER. If the artist re-exports
  // with different margins, only these two constants need to change.
  const FEET_Y_RATIO = 0.68;   // visible-feet vertical position within the sprite (0=top, 1=bottom)
  const FEET_X_RATIO = 0.38;   // visible-feet horizontal position (0=left, 1=right)
  const dx = BATTER.x - SPRITE_DISPLAY_SIZE * FEET_X_RATIO;
  const dy = BATTER.y - SPRITE_DISPLAY_SIZE * FEET_Y_RATIO;
  ctx.drawImage(sprites.sheet, sx, sy, sw, sh, dx, dy, SPRITE_DISPLAY_SIZE, SPRITE_DISPLAY_SIZE);
  return true;
}

// ---- Component ----

export default function GameScreen({ profile, onGameEnd }) {
  const [game, setGame] = useState(() => createGameState(profile));
  const [swingType, setSwingType] = useState('normal');
  const [swingResult, setSwingResult] = useState(null);
  const [didYouKnow, setDidYouKnow] = useState(null);
  const [studyQuestions, setStudyQuestions] = useState(null);
  const [aiHalf, setAiHalf] = useState(null); // { steps, idx }

  const canvasRef = useRef(null);
  const pitchRef = useRef(null); // { pitch, startTime, duration, resolved, landing }
  const batRef = useRef(null); // { startTime, duration }
  const hitBallRef = useRef(null); // { startTime, duration, kind, origin, target, peakY }
  // Which fielder is chasing the ball + their motion timing. Has two phases:
  // chase (move from home to ball-landing spot) then return (slide back home).
  const fielderChaseRef = useRef(null); // { who: 'ss'|'2b', target, chaseStart, chaseEnd, returnEnd }
  const rafRef = useRef(null);
  const batterSpritesRef = useRef(null);  // populated by loadBatterSprites()

  // Diagnostic: ?sprites=placeholders forces the placeholder rectangles to
  // render even when real art isn't dropped in yet. Used to verify the swap
  // pipeline end-to-end before sprite delivery.
  const showPlaceholders = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('sprites') === 'placeholders';

  // Preload the 8 swing-frame sprites once at mount. Mutates a ref so the
  // render loop can read it without re-triggering its own effect.
  useEffect(() => {
    let cancelled = false;
    loadBatterSprites().then((loaded) => {
      if (!cancelled) batterSpritesRef.current = loaded;
    });
    return () => { cancelled = true; };
  }, []);

  const currentBatter = game.lineup[game.currentBatterIndex % game.lineup.length] || { name: '—', batting: 3 };
  const teamAvg = getTeamAverage(profile.roster);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let alive = true;

    const render = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, CW, CH);

      // Catcher-cam depth layering: far -> near
      // 1. Sky (furthest)
      drawSky(ctx);
      // 2. Stadium / outfield (far background)
      drawOutfield(ctx);
      // 2b. Jumbotron scoreboard mounted on the outfield wall (live game state)
      drawJumbotron(ctx, game, profile.teamName);
      // 3. Pitcher on the mound (mid-distance)
      drawPitcher(ctx, profile.teamColor?.primary);
      // 3b. Infielders — shortstop (left) and second baseman (right). They
      // sit idle at their home positions until a hit, at which point the
      // closer one chases the ball, then jogs back home.
      {
        const ssPos = computeFielderPos('ss', fielderChaseRef.current, Date.now());
        const sbPos = computeFielderPos('2b', fielderChaseRef.current, Date.now());
        drawFielder(ctx, ssPos.x, ssPos.y, FIELDER_SCALE);
        drawFielder(ctx, sbPos.x, sbPos.y, FIELDER_SCALE);
        // Clear the chase once both phases are done
        if (fielderChaseRef.current && Date.now() >= fielderChaseRef.current.returnEnd) {
          fielderChaseRef.current = null;
        }
      }
      // 4. Infield (dirt, foul lines, batter's box, home plate - foreground ground)
      drawInfield(ctx);

      // 5. Strike zone overlay (floats in mid-scene - only during batting phases)
      if (
        game.phase === GAME_PHASES.BATTING ||
        game.phase === GAME_PHASES.PITCH_INCOMING ||
        game.phase === GAME_PHASES.SWING_RESULT
      ) {
        drawStrikeZone(ctx);
      }

      // 6. Ball in flight (drawn before batter so batter obscures ball if it passes behind him)
      if (pitchRef.current) {
        const p = pitchRef.current;
        const t = Math.min(1, (Date.now() - p.startTime) / p.duration);
        const ball = computeBallAt(p.pitch, t);
        drawLandingMarker(ctx, ball.land.x, ball.land.y, t);
        drawBall(ctx, ball.x, ball.y, ball.size);
        if (t >= 1 && !p.resolved) {
          p.resolved = true;
          pitchRef.current = null;
          if (p.pitch.isStrike) resolveStrike();
          else resolveBall();
        }
      }

      // 6b. Hit ball — launched from the contact point on a parabolic arc when
      // the batter makes contact. Clears itself after the trajectory completes.
      if (hitBallRef.current) {
        const h = hitBallRef.current;
        const elapsed = Date.now() - h.startTime;
        if (elapsed >= 0) {
          const t = Math.min(1, elapsed / h.duration);
          const ball = computeHitBallAt(h.traj, t);
          drawBall(ctx, ball.x, ball.y, ball.size);
          if (t >= 1) hitBallRef.current = null;
        }
      }

      // 7. Batter (big foreground character)
      // Compute swing progress (null = idle, 0..1 = mid-swing).
      let batT = null;
      if (batRef.current) {
        const bt = (Date.now() - batRef.current.startTime) / batRef.current.duration;
        if (bt >= 1) {
          batRef.current = null;
          batT = null;
        } else {
          batT = bt;
        }
      }
      // Sprite-based renderer when REAL art is loaded. Falls back to the
      // canvas-math drawBatter() if:
      //   - sprites haven't loaded yet (first paint), OR
      //   - sprites couldn't be fetched (placeholder fallback engaged), unless
      //     the user passed ?sprites=placeholders to preview the placeholders.
      // This means dropping real PNGs into public/sprites/batter/ is the only
      // step needed to switch from the canvas batter to the sprite batter.
      const sprites = batterSpritesRef.current;
      let drewWithSprites = false;
      if (sprites && sprites.ready && (!sprites.usingPlaceholders || showPlaceholders)) {
        drewWithSprites = drawBatterSprite(ctx, sprites, batT);
      }
      if (!drewWithSprites) {
        drawBatter(ctx, profile.teamColor?.primary || '#1f3a93', batT, profile.teamName);
      }

      // (Catcher removed — batter on the left side is now the foreground anchor)
      // (Corner bases-inset removed — base runners now live on the jumbotron)

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // Jumbotron reads live game state — re-capture the render closure whenever
    // any displayed value changes so the scoreboard stays in sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    game.phase, game.bases, profile.teamColor,
    game.playerScore, game.aiScore, game.inning, game.isTopHalf,
    game.balls, game.strikes, game.outs,
  ]);

  // ---- Pitch & swing ----

  function throwPitch() {
    const pitch = generatePitch(teamAvg);
    const duration = pitchDurationMs(teamAvg);
    pitchRef.current = { pitch, startTime: Date.now(), duration, resolved: false };
    hitBallRef.current = null;  // clear any leftover hit-ball animation from the previous pitch
    fielderChaseRef.current = null;  // and snap fielders back home
    setGame((g) => ({ ...g, phase: GAME_PHASES.PITCH_INCOMING, pitchLocation: pitch }));
  }

  const handleSwing = useCallback(() => {
    if (game.phase !== GAME_PHASES.PITCH_INCOMING) return;
    const p = pitchRef.current;
    if (!p || p.resolved) return;

    const t = (Date.now() - p.startTime) / p.duration;
    // Sweet spot centered at 0.92 (ball nearly at plate). Wider window so any
    // swing within ~65% of pitch duration of perfect still has a real shot.
    const rawOffset = t - 0.92;
    const timing = Math.min(1, Math.abs(rawOffset) / 0.65);

    batRef.current = { startTime: Date.now(), duration: 520 };  // 2× slower so the 8 frames read clearly
    p.resolved = true;
    pitchRef.current = null;

    const result = calculateSwingResult(timing, p.pitch, currentBatter, swingType);
    // If contact was made (any non-miss result), launch the ball on a hit
    // trajectory so the player sees the ball get hit, not just disappear.
    // The trajectory starts ~150ms after the swing begins so it lines up
    // with the bat reaching the contact point.
    if (result.type !== 'miss') {
      const traj = buildHitTrajectory(result.type);
      const ballStart = Date.now() + 150;
      hitBallRef.current = {
        startTime: ballStart,
        duration: traj.duration,
        traj,
      };
      // Send a fielder after the ball. Closer-to-the-target fielder chases.
      // Skip the chase for home runs and fouls — fielders can't catch those.
      if (result.type !== 'homerun' && result.type !== 'foul') {
        const ssDist = Math.hypot(traj.target.x - SHORTSTOP_HOME.x, traj.target.y - SHORTSTOP_HOME.y);
        const sbDist = Math.hypot(traj.target.x - SECOND_BASE_HOME.x, traj.target.y - SECOND_BASE_HOME.y);
        const who = ssDist <= sbDist ? 'ss' : '2b';
        fielderChaseRef.current = {
          who,
          target: { x: traj.target.x, y: traj.target.y },
          // Fielder reaches the ball at the same time the ball lands
          chaseStart: ballStart,
          chaseEnd: ballStart + traj.duration,
          returnEnd: ballStart + traj.duration + 800,  // 800ms to jog back home
        };
      }
    }
    // Timing feedback on every swing — always show direction
    const isHit = result.bases > 0;
    if (rawOffset < -0.15) result.timingHint = 'Way too early!';
    else if (rawOffset < -0.05) result.timingHint = 'A little early';
    else if (rawOffset < 0 && !isHit) result.timingHint = 'Slightly early';
    else if (rawOffset > 0.15) result.timingHint = 'Way too late!';
    else if (rawOffset > 0.05) result.timingHint = 'A little late';
    else if (rawOffset > 0 && !isHit) result.timingHint = 'Slightly late';
    else if (isHit) result.timingHint = 'Great timing!';
    else result.timingHint = rawOffset <= 0 ? 'Slightly early' : 'Slightly late';
    setSwingResult(result);

    if (result.type === 'miss') {
      const wasThirdStrike = game.strikes >= 2;
      if (wasThirdStrike) {
        result.description = 'Strike three — you\'re out!';
      }
      // Count the strike in game state but keep the swing result
      // (with timing hint) visible — no second overlay
      setGame((g) => {
        const newStrikes = g.strikes + 1;
        if (newStrikes >= 3) {
          return { ...g, strikes: 0, balls: 0, outs: g.outs + 1, phase: GAME_PHASES.SWING_RESULT };
        }
        return { ...g, strikes: newStrikes, phase: GAME_PHASES.SWING_RESULT };
      });
      setTimeout(() => {
        setSwingResult(null);
        if (wasThirdStrike) {
          afterPlay(true);
        } else {
          setGame((g) => ({ ...g, phase: GAME_PHASES.BATTING }));
        }
      }, wasThirdStrike ? 1800 : 1500);
      return;
    }
    if (result.type === 'foul') {
      setGame((g) => ({
        ...g,
        strikes: Math.min(g.strikes + 1, 2),
        phase: GAME_PHASES.SWING_RESULT,
      }));
      setTimeout(() => {
        setSwingResult(null);
        setGame((g) => ({ ...g, phase: GAME_PHASES.BATTING }));
      }, 1500);
      return;
    }
    if (result.isOut) {
      setGame((g) => ({ ...g, outs: g.outs + 1, phase: GAME_PHASES.SWING_RESULT }));
      setTimeout(() => { setSwingResult(null); afterPlay(true); }, 1800);
      return;
    }
    // Hit
    setGame((g) => {
      const { newBases, runs } = advanceRunners(g.bases, result.bases);
      return {
        ...g,
        bases: newBases,
        playerScore: g.playerScore + runs,
        phase: GAME_PHASES.SWING_RESULT,
        lastPlayDescription: result.description + (runs > 0 ? ` ${runs} run${runs > 1 ? 's' : ''} scored!` : ''),
      };
    });
    setTimeout(() => { setSwingResult(null); afterPlay(false); }, 2200);
  }, [game.phase, currentBatter, swingType]);

  function resolveStrike() {
    setGame((g) => {
      const newStrikes = g.strikes + 1;
      if (newStrikes >= 3) {
        setSwingResult({ type: 'miss', description: 'STRIKE THREE — YOU\'RE OUT!' });
        setTimeout(() => {
          setSwingResult(null);
          afterPlay(true);
        }, 1400);
        return { ...g, strikes: 0, balls: 0, outs: g.outs + 1, phase: GAME_PHASES.SWING_RESULT };
      }
      setSwingResult({ type: 'strike', description: 'Strike!' });
      setTimeout(() => setSwingResult(null), 900);
      return { ...g, strikes: newStrikes, phase: GAME_PHASES.BATTING };
    });
  }

  function resolveBall() {
    setGame((g) => {
      const newBalls = g.balls + 1;
      if (newBalls >= 4) {
        const { newBases, runs } = advanceRunners(g.bases, 1);
        setSwingResult({ type: 'walk', description: 'Ball four — take your base!' });
        setTimeout(() => { setSwingResult(null); afterPlay(false); }, 1500);
        return {
          ...g,
          balls: 0,
          strikes: 0,
          bases: newBases,
          playerScore: g.playerScore + runs,
          phase: GAME_PHASES.SWING_RESULT,
        };
      }
      setSwingResult({ type: 'ball', description: 'Ball!' });
      setTimeout(() => setSwingResult(null), 800);
      return { ...g, balls: newBalls, phase: GAME_PHASES.BATTING };
    });
  }

  function afterPlay(wasOut) {
    setGame((prev) => {
      if (prev.outs >= 3) {
        return { ...prev, phase: GAME_PHASES.HALF_INNING_OVER };
      }
      // Show Did You Know between batters
      setDidYouKnow(getRandomFact());
      return {
        ...prev,
        currentBatterIndex: prev.currentBatterIndex + 1,
        strikes: 0,
        balls: 0,
        phase: GAME_PHASES.DID_YOU_KNOW,
      };
    });
  }

  function closeDidYouKnow() {
    setDidYouKnow(null);
    setGame((g) => ({ ...g, phase: GAME_PHASES.BATTING }));
  }

  // ---- Half-inning transitions ----

  function startAiHalfInning() {
    const { steps } = simulateAIHalfInningSteps(teamAvg);
    setAiHalf({ steps, idx: 0, runs: 0, outs: 0, bases: [false, false, false] });
    setGame((g) => ({ ...g, phase: GAME_PHASES.AI_BATTING, isTopHalf: false, outs: 0, bases: [false, false, false], strikes: 0, balls: 0 }));
  }

  function advanceAiStep() {
    setAiHalf((h) => {
      if (!h) return h;
      const step = h.steps[h.idx];
      const runsAdded = step.runs || 0;
      setGame((g) => ({
        ...g,
        aiScore: g.aiScore + runsAdded,
        bases: step.bases,
        outs: step.outs,
      }));
      const nextIdx = h.idx + 1;
      if (nextIdx >= h.steps.length) {
        queueMicrotask(() => {
          setAiHalf(null);
          finishAiHalf();
        });
        return h; // stay on last visible step until transition
      }
      return { ...h, idx: nextIdx };
    });
  }

  function finishAiHalf() {
    setGame((prev) => {
      const mercy = prev.inning >= 1 && checkMercyRule(prev.playerScore, prev.aiScore);
      // Study break after every full inning (both halves complete)
      const breakNum = prev.studyBreakNumber + 1;
      setStudyQuestions(getStudyQuestions(5));
      return {
        ...prev,
        isTopHalf: true,
        outs: 0,
        bases: [false, false, false],
        strikes: 0,
        balls: 0,
        currentBatterIndex: prev.currentBatterIndex, // keep rotation
        studyBreakNumber: breakNum,
        phase: GAME_PHASES.STUDY_BREAK,
        _mercy: mercy,
      };
    });
  }

  function handleStudyBreakComplete(results) {
    const correctCount = results.filter((r) => r.correct).length;
    const coinsFromBreak = correctCount * 10;

    setGame((prev) => {
      const newResults = [...prev.studyBreakResults, { correct: correctCount, total: 5 }];
      const newCoins = prev.coinsEarned + coinsFromBreak;
      const isLastBreak = prev.studyBreakNumber >= 3;
      const mercy = checkMercyRule(prev.playerScore, prev.aiScore);

      if (isLastBreak && correctCount >= 4) {
        setStudyQuestions(null);
        return {
          ...prev,
          coinsEarned: newCoins,
          studyBreakResults: newResults,
          phase: GAME_PHASES.BONUS_ROUND,
        };
      }
      if (prev.inning >= 3 || mercy) {
        setStudyQuestions(null);
        return {
          ...prev,
          coinsEarned: newCoins,
          studyBreakResults: newResults,
          phase: GAME_PHASES.GAME_OVER,
        };
      }
      setStudyQuestions(null);
      return {
        ...prev,
        inning: prev.inning + 1,
        isTopHalf: true,
        outs: 0,
        bases: [false, false, false],
        strikes: 0,
        balls: 0,
        coinsEarned: newCoins,
        studyBreakResults: newResults,
        phase: GAME_PHASES.BATTING,
      };
    });
  }

  function handleBonusComplete(bonusCoins) {
    setGame((prev) => ({
      ...prev,
      coinsEarned: prev.coinsEarned + bonusCoins,
      phase: GAME_PHASES.GAME_OVER,
    }));
  }

  function handleGameOver() {
    onGameEnd({
      playerScore: game.playerScore,
      aiScore: game.aiScore,
      coinsEarned: game.coinsEarned,
      studyBreakResults: game.studyBreakResults,
      won: game.playerScore > game.aiScore,
    });
  }

  // ---- Alt screens ----

  if (game.phase === GAME_PHASES.STUDY_BREAK && studyQuestions) {
    return (
      <StudyBreak
        questions={studyQuestions}
        breakNumber={game.studyBreakNumber}
        onComplete={handleStudyBreakComplete}
      />
    );
  }

  if (game.phase === GAME_PHASES.BONUS_ROUND) {
    return <BonusRound onComplete={handleBonusComplete} />;
  }

  if (game.phase === GAME_PHASES.GAME_OVER) {
    const won = game.playerScore > game.aiScore;
    return (
      <div className="game-over-screen">
        <div className="game-over-card">
          <h1 className={won ? 'win-text' : 'loss-text'}>
            {won ? 'YOU WIN!' : game.playerScore === game.aiScore ? 'TIE GAME!' : 'GAME OVER'}
          </h1>
          <div className="final-score">
            <div className="score-team">
              <span className="score-label">The {profile.teamName}</span>
              <span className="score-number big">{game.playerScore}</span>
            </div>
            <span className="score-vs">vs</span>
            <div className="score-team">
              <span className="score-label">Opponents</span>
              <span className="score-number">{game.aiScore}</span>
            </div>
          </div>
          <div className="coins-earned">
            <span className="coin-icon big">&#x1FA99;</span>
            <span className="coins-text">+{game.coinsEarned} Scholar Coins</span>
          </div>
          <button className="btn btn-primary btn-big" onClick={handleGameOver}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (game.phase === GAME_PHASES.HALF_INNING_OVER) {
    return (
      <div className="inning-break-screen">
        <div className="inning-break-card">
          <h2>End of Half Inning</h2>
          <p className="inning-sub">
            {game.isTopHalf ? 'Your offense is done. Opponent is up next.' : 'Opponent done batting.'}
          </p>
          <div className="final-score">
            <div className="score-team">
              <span className="score-label">You</span>
              <span className="score-number">{game.playerScore}</span>
            </div>
            <span className="score-vs">-</span>
            <div className="score-team">
              <span className="score-label">Opp</span>
              <span className="score-number">{game.aiScore}</span>
            </div>
          </div>
          <button className="btn btn-primary btn-big" onClick={startAiHalfInning}>
            {game.isTopHalf ? 'Take the field \u2192' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  if (game.phase === GAME_PHASES.AI_BATTING && aiHalf) {
    const step = aiHalf.steps[aiHalf.idx];
    const isLast = aiHalf.idx + 1 >= aiHalf.steps.length;
    return (
      <div className="ai-batting-screen">
        <div className="ai-batting-header">
          <span className="ai-batting-label">OPPONENT AT BAT</span>
          <div className="ai-score-pill">
            You {game.playerScore} &nbsp; &ndash; &nbsp; Opp {game.aiScore}
          </div>
          <div className="ai-count">
            Outs: {'\u25CF'.repeat(step?.outs ?? 0)}{'\u25CB'.repeat(3 - (step?.outs ?? 0))}
          </div>
        </div>
        <div className="ai-play-card">
          <p className="ai-play-description">{step?.description}</p>
          <p className="ai-play-hint">(Fielding is auto-simulated for now &mdash; real fielding controls coming in the next pass.)</p>
          <button className="btn btn-primary btn-big" onClick={advanceAiStep}>
            {isLast ? 'End Half Inning' : 'Next Play'}
          </button>
        </div>
      </div>
    );
  }

  // ---- Main batting UI ----

  const pitchReady = game.phase === GAME_PHASES.BATTING;
  const pitchLive = game.phase === GAME_PHASES.PITCH_INCOMING;

  return (
    <div className="game-screen v2">
      {/* Scoreboard now lives ON the field \u2014 drawn as the jumbotron inside the
          canvas (see drawJumbotron). No separate HTML scoreboard bar. */}

      {/* Phase banner */}
      <div className="phase-banner batting">YOU&rsquo;RE BATTING</div>

      {/* Field scene */}
      <div className="field-wrap">
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          className="game-field v2"
          onClick={pitchLive ? handleSwing : undefined}
        />
        {swingResult && (
          <div className={`swing-result ${swingResult.type}`}>
            {swingResult.description}
            {swingResult.timingHint && (
              <div className="timing-hint">{swingResult.timingHint}</div>
            )}
          </div>
        )}
      </div>

      {/* Batter info */}
      <div className="batter-info">
        <span className="batter-name">Now batting: <strong>{currentBatter.name}</strong></span>
        <span className="batter-stat">BAT {currentBatter.batting}</span>
      </div>

      {/* Swing type selector */}
      <div className="swing-types">
        {SWING_TYPES.map((s) => (
          <button
            key={s.id}
            className={`swing-type-btn ${swingType === s.id ? 'active' : ''}`}
            style={swingType === s.id ? { backgroundColor: s.color, color: '#fff' } : undefined}
            onClick={() => setSwingType(s.id)}
            disabled={pitchLive}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Action */}
      <div className="game-controls">
        {pitchReady && (
          <button className="btn btn-pitch" onClick={throwPitch}>
            Pitch!
          </button>
        )}
        {pitchLive && (
          <button className="btn btn-swing" onClick={handleSwing}>
            SWING!
          </button>
        )}
      </div>

      {/* Coins HUD */}
      <div className="game-coins">
        <span className="coin-icon">&#x1FA99;</span> {game.coinsEarned}
      </div>

      {/* Did You Know overlay */}
      {didYouKnow && (
        <DidYouKnowCard fact={didYouKnow} onClose={closeDidYouKnow} />
      )}
    </div>
  );
}

// Bases diamond drawn in top-right corner of canvas
// ---- Bonus Round (manual-advance version) ----
function BonusRound({ onComplete }) {
  const [questions] = useState(() => {
    const pool = [...scienceQuestions.questions];
    return pool.sort(() => Math.random() - 0.5);
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [coins, setCoins] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const current = questions[currentIdx];

  function handleAnswer(optionIdx) {
    if (showResult) return;
    setSelected(optionIdx);
    setShowResult(true);
    const isCorrect = optionIdx === current.answer;
    if (isCorrect) setCoins((c) => c + 10);
    else setWrongCount((w) => w + 1);
  }

  function handleNext() {
    const isCorrect = selected === current.answer;
    if (!isCorrect && wrongCount >= 3) {
      onComplete(coins);
      return;
    }
    setSelected(null);
    setShowResult(false);
    setCurrentIdx((i) => i + 1);
  }

  if (!current) {
    onComplete(coins);
    return null;
  }

  const isCorrect = selected === current.answer;
  const willEnd = showResult && !isCorrect && wrongCount >= 3;

  return (
    <div className="study-screen">
      <div className="study-card">
        <div className="bonus-header">
          <h2>Bonus Round!</h2>
          <p>Keep going until you get 3 wrong.</p>
          <div className="bonus-status">
            <span className="coin-icon">&#x1FA99;</span> +{coins}
            <span className="wrong-count">
              {'\u274C'.repeat(wrongCount)}{'\u2B1C'.repeat(3 - wrongCount)}
            </span>
          </div>
        </div>
        <p className="study-question">{current.question}</p>
        <div className="study-options">
          {current.options.map((opt, i) => (
            <button
              key={i}
              className={`study-option ${showResult ? (i === current.answer ? 'correct' : i === selected ? 'wrong' : '') : ''}`}
              onClick={() => handleAnswer(i)}
              disabled={showResult}
            >
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
        {showResult && (
          <>
            <div className={`study-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
              <span className="feedback-icon">{isCorrect ? '\u2714' : '\u2716'}</span>
              <div className="feedback-body">
                <p className="study-explanation">{current.explanation}</p>
                {isCorrect && <span className="coin-earned">+10 &#x1FA99;</span>}
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleNext}>
              {willEnd ? 'Finish Bonus Round' : 'Next Question'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
