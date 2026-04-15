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

// Scene anchor points
const MOUND = { x: 560, y: 265 };
const PLATE = { x: 210, y: 430 };
const BATTER = { x: 165, y: 380 };
const ZONE = { cx: 210, cy: 355, w: 90, h: 100 }; // strike zone rectangle (center + size)

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
  const wallTop = CH * 0.42;

  // Upper deck / stadium roof silhouette (dark band)
  ctx.fillStyle = '#2a3447';
  ctx.fillRect(0, wallTop - 24, CW, 24);
  // Light-tower hints
  ctx.fillStyle = '#f1c40f';
  [180, 450, 680].forEach((tx) => {
    ctx.beginPath();
    ctx.arc(tx, wallTop - 20, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Bleacher crowd band (speckled)
  ctx.fillStyle = '#7a6a55';
  ctx.fillRect(0, wallTop, CW, 18);
  // Crowd dots
  for (let i = 0; i < 180; i++) {
    const cx = Math.random() * CW;
    const cy = wallTop + 3 + Math.random() * 12;
    ctx.fillStyle = ['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1', '#9b59b6'][i % 5];
    ctx.fillRect(cx, cy, 2, 2);
  }

  // Outfield wall (green with padding strip)
  ctx.fillStyle = '#2e7d32';
  ctx.fillRect(0, wallTop + 18, CW, 22);
  // Padded top rail
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(0, wallTop + 18, CW, 3);
  // Wall shadow / bottom line
  ctx.fillStyle = '#1b5e20';
  ctx.fillRect(0, wallTop + 38, CW, 4);

  // Outfield grass
  const grad = ctx.createLinearGradient(0, wallTop + 42, 0, CH);
  grad.addColorStop(0, '#66C84D');
  grad.addColorStop(1, '#3E9A2E');
  ctx.fillStyle = grad;
  ctx.fillRect(0, wallTop + 42, CW, CH - (wallTop + 42));

  // Mowed grass stripes (subtle)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) continue;
    ctx.fillRect(0, wallTop + 42 + i * 22, CW, 22);
  }
}

function drawInfield(ctx) {
  // Infield dirt arc around home
  ctx.fillStyle = '#D2A06B';
  ctx.beginPath();
  ctx.ellipse(PLATE.x + 180, PLATE.y + 20, 460, 180, 0, Math.PI, 0, true);
  ctx.fill();
  // Pitcher's mound
  ctx.fillStyle = '#C08B5C';
  ctx.beginPath();
  ctx.ellipse(MOUND.x, MOUND.y + 20, 55, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Home plate
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(PLATE.x - 30, PLATE.y);
  ctx.lineTo(PLATE.x + 30, PLATE.y);
  ctx.lineTo(PLATE.x + 30, PLATE.y + 14);
  ctx.lineTo(PLATE.x, PLATE.y + 26);
  ctx.lineTo(PLATE.x - 30, PLATE.y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawStrikeZone(ctx) {
  const x = ZONE.cx - ZONE.w / 2;
  const y = ZONE.cy - ZONE.h / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x, y, ZONE.w, ZONE.h);
  ctx.setLineDash([]);
  // Subtle fill
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x, y, ZONE.w, ZONE.h);
  ctx.restore();
}

function drawPitcher(ctx, teamColor) {
  // Bold-line cartoon pitcher, mid-windup, facing the batter (left on screen)
  const x = MOUND.x;
  const y = MOUND.y;
  const jersey = teamColor || '#c0392b';
  const jerseyDark = darken(jersey, 0.35);
  const pants = '#F5F1E8';        // cream/white pants
  const pantsDark = darken(pants, 0.15);
  const skin = '#F2C8A0';
  const skinDark = darken(skin, 0.2);

  // Back leg (planted, right side of body facing us)
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 2, y + 4);
    c.lineTo(x + 14, y + 4);
    c.lineTo(x + 16, y + 30);
    c.lineTo(x + 4, y + 30);
    c.closePath();
  }, pants);
  // Cleat
  outlinedRect(ctx, x + 2, y + 28, 18, 5, INK);

  // Front leg (kicking up, bent)
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 10, y + 4);
    c.lineTo(x - 2, y + 4);
    c.lineTo(x - 14, y + 22);
    c.lineTo(x - 20, y + 18);
    c.closePath();
  }, pants);
  outlinedRect(ctx, x - 22, y + 16, 10, 5, INK);

  // Torso (jersey) - slight lean forward
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 13, y - 14);
    c.lineTo(x + 13, y - 16);
    c.lineTo(x + 15, y + 6);
    c.lineTo(x - 12, y + 6);
    c.closePath();
  }, jersey);

  // Jersey shadow wedge
  ctx.fillStyle = jerseyDark;
  ctx.beginPath();
  ctx.moveTo(x - 13, y - 14);
  ctx.lineTo(x - 5, y - 15);
  ctx.lineTo(x - 8, y + 6);
  ctx.lineTo(x - 12, y + 6);
  ctx.closePath();
  ctx.fill();

  // Glove-side arm (extended forward-left, toward batter)
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 10, y - 8);
    c.lineTo(x - 6, y - 14);
    c.lineTo(x - 28, y - 4);
    c.lineTo(x - 30, y + 2);
    c.closePath();
  }, jersey);
  // Glove
  outlinedCircle(ctx, x - 32, y - 2, 8, '#6b4a2b');

  // Throwing arm (cocked back over head, holding ball)
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 8, y - 14);
    c.lineTo(x + 14, y - 12);
    c.lineTo(x + 22, y - 28);
    c.lineTo(x + 16, y - 32);
    c.closePath();
  }, jersey);
  // Hand
  outlinedCircle(ctx, x + 20, y - 30, 4, skin);

  // Head
  outlinedCircle(ctx, x, y - 24, 10, skin);
  // Cheek/jaw shadow
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.arc(x + 4, y - 22, 7, Math.PI * 1.7, Math.PI * 0.4);
  ctx.fill();

  // Cap (crown)
  outlinedPath(ctx, (c) => {
    c.arc(x, y - 28, 10, Math.PI, Math.PI * 2);
    c.lineTo(x + 10, y - 25);
    c.lineTo(x - 10, y - 25);
    c.closePath();
  }, jersey);
  // Cap brim
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 14, y - 25);
    c.lineTo(x + 2, y - 25);
    c.lineTo(x + 1, y - 22);
    c.lineTo(x - 12, y - 22);
    c.closePath();
  }, jerseyDark);

  // Sunglasses bar (tiny detail, signature bold-line style)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 23);
  ctx.lineTo(x + 6, y - 23);
  ctx.stroke();
}

function drawCatcher(ctx) {
  // Bold-line cartoon catcher, squatting, seen from behind-right
  const x = PLATE.x - 55;
  const y = PLATE.y - 6;
  const jersey = '#4a5568';       // slate gray
  const jerseyDark = darken(jersey, 0.35);
  const gear = '#2c3e50';          // navy gear
  const shinGuards = '#c0392b';    // red shin guards pop against gray

  // Back/squat torso
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 14, y - 8);
    c.lineTo(x + 14, y - 8);
    c.lineTo(x + 16, y + 14);
    c.lineTo(x - 16, y + 14);
    c.closePath();
  }, jersey);

  // Chest protector shadow
  ctx.fillStyle = jerseyDark;
  ctx.fillRect(x - 10, y - 4, 20, 14);

  // Shin guards / knees (squatting pose)
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 18, y + 14);
    c.lineTo(x - 6, y + 14);
    c.lineTo(x - 10, y + 30);
    c.lineTo(x - 22, y + 30);
    c.closePath();
  }, shinGuards);
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 6, y + 14);
    c.lineTo(x + 18, y + 14);
    c.lineTo(x + 22, y + 30);
    c.lineTo(x + 10, y + 30);
    c.closePath();
  }, shinGuards);

  // Shin guard stripes (horizontal lines for that padded look)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  [20, 24].forEach((offset) => {
    ctx.beginPath();
    ctx.moveTo(x - 20, y + offset);
    ctx.lineTo(x - 8, y + offset);
    ctx.moveTo(x + 8, y + offset);
    ctx.lineTo(x + 20, y + offset);
    ctx.stroke();
  });

  // Mitt (left arm extended toward pitcher, slightly up)
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 14, y - 2);
    c.lineTo(x + 24, y - 8);
    c.lineTo(x + 30, y - 2);
    c.lineTo(x + 22, y + 6);
    c.closePath();
  }, jersey);
  // Mitt glove
  outlinedCircle(ctx, x + 32, y - 2, 9, '#6b4a2b');
  outlinedCircle(ctx, x + 32, y - 2, 4, '#4e3420');

  // Helmet / catcher's mask (from behind)
  outlinedCircle(ctx, x, y - 18, 12, gear);
  // Mask cage hint (vertical bars on the side that's visible)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  [-4, 0, 4].forEach((ox) => {
    ctx.beginPath();
    ctx.moveTo(x + ox, y - 26);
    ctx.lineTo(x + ox, y - 10);
    ctx.stroke();
  });
}

function drawBatter(ctx, teamColor, batSwingT) {
  // Bold-line cartoon batter in 3/4 back-profile stance.
  // batSwingT: 0 (cocked over shoulder) .. 1 (extended across plate), or null = rest.
  const x = BATTER.x;
  const y = BATTER.y;
  const jersey = teamColor || '#1f3a93';
  const jerseyDark = darken(jersey, 0.35);
  const pants = '#F5F1E8';         // cream pants
  const pantsDark = darken(pants, 0.15);
  const skin = '#E7B691';
  const skinDark = darken(skin, 0.18);

  // ---- Legs (athletic stance, slightly wide) ----
  // Back leg (right side, planted)
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 2, y + 10);
    c.lineTo(x + 14, y + 12);
    c.lineTo(x + 16, y + 42);
    c.lineTo(x + 4, y + 42);
    c.closePath();
  }, pants);
  // Back cleat
  outlinedRect(ctx, x, y + 40, 20, 6, INK);

  // Front leg (left side, slightly forward)
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 14, y + 10);
    c.lineTo(x - 2, y + 10);
    c.lineTo(x - 4, y + 42);
    c.lineTo(x - 18, y + 42);
    c.closePath();
  }, pants);
  outlinedRect(ctx, x - 22, y + 40, 22, 6, INK);

  // Pants shadow stripe (simple cel-shading)
  ctx.fillStyle = pantsDark;
  ctx.fillRect(x - 14, y + 10, 4, 32);
  ctx.fillRect(x + 2, y + 12, 4, 30);

  // Belt
  outlinedRect(ctx, x - 16, y + 6, 32, 6, INK);

  // ---- Torso (jersey, 3/4 back view - we see back-right of player) ----
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 16, y - 20);
    c.lineTo(x + 16, y - 22);
    c.lineTo(x + 18, y + 8);
    c.lineTo(x - 16, y + 8);
    c.closePath();
  }, jersey);

  // Jersey shadow (back/shoulder side, facing away from camera)
  ctx.fillStyle = jerseyDark;
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 20);
  ctx.lineTo(x - 4, y - 21);
  ctx.lineTo(x - 4, y + 8);
  ctx.lineTo(x - 16, y + 8);
  ctx.closePath();
  ctx.fill();

  // Jersey number on back (big, bold - signature cartoon sports look)
  ctx.fillStyle = '#F5F1E8';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.font = 'bold 18px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('9', x + 2, y - 6);
  ctx.strokeText('9', x + 2, y - 6);

  // ---- Head (turned toward pitcher, 3/4 view from behind-right) ----
  const headX = x + 2;
  const headY = y - 32;
  outlinedCircle(ctx, headX, headY, 13, skin);
  // Jaw shadow (darker wedge on back side)
  ctx.fillStyle = skinDark;
  ctx.beginPath();
  ctx.arc(headX - 3, headY + 2, 10, Math.PI * 1.6, Math.PI * 0.3);
  ctx.fill();
  // Ear hint
  outlinedCircle(ctx, headX - 10, headY + 1, 3, skin, 1.5);

  // ---- Helmet ----
  // Crown (dome)
  outlinedPath(ctx, (c) => {
    c.arc(headX, headY - 2, 14, Math.PI * 0.95, Math.PI * 2.05);
    c.closePath();
  }, jersey);
  // Helmet shadow stripe
  ctx.fillStyle = jerseyDark;
  ctx.beginPath();
  ctx.arc(headX, headY - 2, 14, Math.PI * 0.95, Math.PI * 1.3);
  ctx.lineTo(headX, headY - 2);
  ctx.closePath();
  ctx.fill();
  // Helmet brim/visor (juts forward over eye)
  outlinedPath(ctx, (c) => {
    c.moveTo(headX + 4, headY - 4);
    c.lineTo(headX + 16, headY - 1);
    c.lineTo(headX + 15, headY + 3);
    c.lineTo(headX + 4, headY - 1);
    c.closePath();
  }, jerseyDark);
  // Ear flap (side-protector on helmet, classic batting helmet detail)
  outlinedPath(ctx, (c) => {
    c.moveTo(headX - 13, headY - 1);
    c.lineTo(headX - 8, headY + 8);
    c.lineTo(headX - 3, headY + 6);
    c.lineTo(headX - 4, headY - 4);
    c.closePath();
  }, jersey);

  // Sunglasses bar (signature bold-line detail)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(headX + 2, headY);
  ctx.lineTo(headX + 13, headY + 1);
  ctx.stroke();

  // ---- Arms holding bat ----
  // Hands position depends on swing state
  const t = batSwingT == null ? 0 : batSwingT;
  // Cocked over back shoulder at t=0, extended across plate at t=1
  const startAngle = -Math.PI * 0.65;  // bat up and back over shoulder
  const endAngle = Math.PI * 0.55;     // bat extended forward
  const angle = startAngle + (endAngle - startAngle) * t;

  const handsX = x + 10;
  const handsY = y - 16;

  // Back arm (connects shoulder to hands) - slight flex
  const shoulderX = x + 10;
  const shoulderY = y - 20;
  outlinedPath(ctx, (c) => {
    c.moveTo(shoulderX - 4, shoulderY);
    c.lineTo(shoulderX + 6, shoulderY - 2);
    c.lineTo(handsX + 4, handsY + 4);
    c.lineTo(handsX - 4, handsY + 4);
    c.closePath();
  }, jersey);

  // Front arm (opposite shoulder, over to hands)
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 12, y - 18);
    c.lineTo(x - 4, y - 20);
    c.lineTo(handsX - 2, handsY + 4);
    c.lineTo(handsX - 10, handsY + 6);
    c.closePath();
  }, jersey);

  // Hands (skin)
  outlinedCircle(ctx, handsX, handsY + 2, 6, skin);

  // ---- Bat ----
  ctx.save();
  ctx.translate(handsX + 2, handsY + 2);
  ctx.rotate(angle);
  // Bat barrel (thicker end, out past the grip)
  ctx.fillStyle = '#C9A36B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -3.5);
  ctx.lineTo(48, -6);
  ctx.lineTo(66, -7);
  ctx.lineTo(66, 7);
  ctx.lineTo(48, 6);
  ctx.lineTo(0, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Wood grain shadow stripe
  ctx.fillStyle = '#8B5E34';
  ctx.beginPath();
  ctx.moveTo(48, 2);
  ctx.lineTo(66, 3);
  ctx.lineTo(66, 7);
  ctx.lineTo(48, 6);
  ctx.closePath();
  ctx.fill();
  // Grip tape (black wrap near handle)
  ctx.fillStyle = '#222';
  ctx.fillRect(0, -4, 12, 8);
  ctx.strokeRect(0, -4, 12, 8);
  // Knob at end
  ctx.beginPath();
  ctx.arc(-2, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#C9A36B';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Swing streak effect during active swing
  if (batSwingT != null && batSwingT > 0.1 && batSwingT < 0.9) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const arcCenterX = handsX + 2;
    const arcCenterY = handsY + 2;
    ctx.arc(arcCenterX, arcCenterY, 48, startAngle, angle);
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
  // Start at pitcher's hand, arc to landing point
  const land = computeLanding(pitch);
  const sx = MOUND.x - 10;
  const sy = MOUND.y - 18;
  const x = sx + (land.x - sx) * t;
  // Arc: parabolic lift in the middle
  const arc = Math.sin(t * Math.PI) * -28;
  const y = sy + (land.y - sy) * t + arc;
  const size = 5 + t * 4;
  return { x, y, size, land };
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
  const rafRef = useRef(null);

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
      drawSky(ctx);
      drawOutfield(ctx);
      drawInfield(ctx);
      drawCatcher(ctx);

      // Strike zone (only during batting-ish phases)
      if (
        game.phase === GAME_PHASES.BATTING ||
        game.phase === GAME_PHASES.PITCH_INCOMING ||
        game.phase === GAME_PHASES.SWING_RESULT
      ) {
        drawStrikeZone(ctx);
      }

      drawPitcher(ctx, profile.teamColor?.primary);

      // Bat position
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
      drawBatter(ctx, profile.teamColor?.secondary || '#1f3a93', batT);

      // Pitch ball + landing marker
      if (pitchRef.current) {
        const p = pitchRef.current;
        const t = Math.min(1, (Date.now() - p.startTime) / p.duration);
        const ball = computeBallAt(p.pitch, t);
        drawLandingMarker(ctx, ball.land.x, ball.land.y, t);
        drawBall(ctx, ball.x, ball.y, ball.size);
        // Auto-resolve when pitch completes without a swing
        if (t >= 1 && !p.resolved) {
          p.resolved = true;
          pitchRef.current = null;
          if (p.pitch.isStrike) resolveStrike();
          else resolveBall();
        }
      }

      // Bases indicator (small diamond inset, top-right of canvas)
      drawBasesInset(ctx, game.bases, profile.teamColor?.primary || '#e74c3c');

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.phase, game.bases, profile.teamColor]);

  // ---- Pitch & swing ----

  function throwPitch() {
    const pitch = generatePitch(teamAvg);
    const duration = pitchDurationMs(teamAvg);
    pitchRef.current = { pitch, startTime: Date.now(), duration, resolved: false };
    setGame((g) => ({ ...g, phase: GAME_PHASES.PITCH_INCOMING, pitchLocation: pitch }));
  }

  const handleSwing = useCallback(() => {
    if (game.phase !== GAME_PHASES.PITCH_INCOMING) return;
    const p = pitchRef.current;
    if (!p || p.resolved) return;

    const t = (Date.now() - p.startTime) / p.duration;
    // Sweet spot centered at 0.85 (ball reaching plate)
    const timing = Math.min(1, Math.abs(t - 0.85) / 0.3);

    batRef.current = { startTime: Date.now(), duration: 260 };
    p.resolved = true;
    pitchRef.current = null;

    const result = calculateSwingResult(timing, p.pitch, currentBatter, swingType);
    setSwingResult(result);

    if (result.type === 'miss') {
      setTimeout(() => { setSwingResult(null); resolveStrike(); }, 1200);
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
      {/* Scoreboard */}
      <div className="scoreboard">
        <div className="score-row">
          <span className="team-badge" style={{ backgroundColor: profile.teamColor?.primary || '#e74c3c' }}>
            {profile.teamName?.substring(0, 3).toUpperCase() || 'YOU'}
          </span>
          <span className="score">{game.playerScore}</span>
          <span className="inning-display">
            {game.isTopHalf ? '\u25B2' : '\u25BC'} Inning {game.inning} / 3
          </span>
          <span className="score">{game.aiScore}</span>
          <span className="team-badge opp">OPP</span>
        </div>
        <div className="count-row">
          <span className="count">B: {'\u25CF'.repeat(game.balls)}{'\u25CB'.repeat(4 - game.balls)}</span>
          <span className="count">S: {'\u25CF'.repeat(game.strikes)}{'\u25CB'.repeat(3 - game.strikes)}</span>
          <span className="count">O: {'\u25CF'.repeat(game.outs)}{'\u25CB'.repeat(3 - game.outs)}</span>
        </div>
      </div>

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
function drawBasesInset(ctx, bases, teamColor) {
  const cx = CW - 70;
  const cy = 60;
  const s = 14;
  const points = [
    [cx, cy + s],       // home
    [cx + s, cy],       // 1st
    [cx, cy - s],       // 2nd
    [cx - s, cy],       // 3rd
  ];
  ctx.save();
  // backdrop
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
  // bases
  const baseCoords = [points[1], points[2], points[3]];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = bases[i] ? teamColor : 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(baseCoords[i][0], baseCoords[i][1], 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

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
