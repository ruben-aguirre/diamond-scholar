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
const BATTER = { x: 560, y: 430 };       // right-handed batter, right of plate, large
const ZONE = { cx: 400, cy: 390, w: 70, h: 90 }; // strike zone centered on home plate

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

  // Scoreboard silhouette on roof (center)
  ctx.fillStyle = '#1a252f';
  ctx.fillRect(CW / 2 - 60, 168, 120, 22);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(CW / 2 - 60, 168, 120, 22);
  // Fake LEDs on scoreboard
  ctx.fillStyle = '#e74c3c';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(CW / 2 - 55 + i * 14, 173, 4, 4);
  }

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

  // Batter's box (chalk outline to the right of home plate where batter stands)
  ctx.strokeStyle = 'rgba(245, 241, 232, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(495, 430);     // near-left corner of box
  ctx.lineTo(640, 430);     // near-right corner
  ctx.lineTo(615, 490);     // far-right corner (perspective)
  ctx.lineTo(460, 490);     // far-left corner (perspective)
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
  const x = MOUND.x;
  const y = MOUND.y;
  const jersey = '#c0392b';              // opponent jersey (red - contrasts with our team colors)
  const jerseyDark = darken(jersey, 0.35);
  const pants = '#F5F1E8';
  const pantsDark = darken(pants, 0.2);
  const skin = '#F2C8A0';

  // Legs (planted stance, both facing camera)
  // Right leg (from viewer's perspective)
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 1, y + 4);
    c.lineTo(x + 9, y + 4);
    c.lineTo(x + 11, y + 22);
    c.lineTo(x + 3, y + 22);
    c.closePath();
  }, pants);
  outlinedRect(ctx, x + 1, y + 20, 12, 4, INK);

  // Left leg
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 9, y + 4);
    c.lineTo(x - 1, y + 4);
    c.lineTo(x - 3, y + 22);
    c.lineTo(x - 11, y + 22);
    c.closePath();
  }, pants);
  outlinedRect(ctx, x - 13, y + 20, 12, 4, INK);

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

function drawCatcher(ctx) {
  // In catcher-cam, the camera IS the catcher. We show only the TOP of his
  // helmet peeking up from the bottom of the frame as a perspective cue -
  // confirms "you're looking over his shoulder" without obscuring the view.
  const x = PLATE.x - 60;  // slightly left of home plate (catcher offset)
  const y = CH - 8;         // right at the bottom of the canvas
  const gear = '#2c3e50';

  // Just the crown of the catcher's helmet/mask poking up
  ctx.fillStyle = gear;
  ctx.beginPath();
  ctx.arc(x, y, 28, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Mask cage hint (vertical bars on the visible crown)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  [-8, 0, 8].forEach((ox) => {
    ctx.beginPath();
    ctx.moveTo(x + ox, y - 26);
    ctx.lineTo(x + ox, y);
    ctx.stroke();
  });
}

function drawBatter(ctx, teamColor, batSwingT, teamNameShort) {
  // CATCHER-CAM: batter is LARGE, in FOREGROUND, seen from BEHIND.
  // Right-handed batter stands on the LEFT side of home plate from the pitcher's
  // view, which is the RIGHT side of the catcher's view. So he's right-of-center.
  // We see his back.
  const x = BATTER.x;
  const y = BATTER.y;
  const jersey = teamColor || '#1f3a93';
  const jerseyDark = darken(jersey, 0.35);
  const jerseyLight = lighten(jersey, 0.2);
  const pants = '#F5F1E8';
  const pantsDark = darken(pants, 0.2);
  const skin = '#E7B691';
  const skinDark = darken(skin, 0.2);

  // ---- Legs (wide athletic stance, seen from behind) ----
  // Left leg (from batter's POV) = LEFT on screen (near side to pitcher)
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 28, y + 15);
    c.lineTo(x - 8, y + 15);
    c.lineTo(x - 10, y + 65);
    c.lineTo(x - 32, y + 65);
    c.closePath();
  }, pants);
  // Left cleat
  outlinedRect(ctx, x - 36, y + 62, 30, 8, INK);
  // Shadow stripe
  ctx.fillStyle = pantsDark;
  ctx.fillRect(x - 28, y + 15, 5, 48);

  // Right leg = RIGHT on screen
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 8, y + 15);
    c.lineTo(x + 28, y + 15);
    c.lineTo(x + 32, y + 65);
    c.lineTo(x + 10, y + 65);
    c.closePath();
  }, pants);
  outlinedRect(ctx, x + 6, y + 62, 30, 8, INK);
  ctx.fillStyle = pantsDark;
  ctx.fillRect(x + 23, y + 15, 5, 48);

  // Belt
  outlinedRect(ctx, x - 32, y + 8, 64, 8, INK);

  // ---- Torso (back view, BIG) ----
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 38, y - 48);   // left shoulder
    c.lineTo(x + 38, y - 48);   // right shoulder
    c.lineTo(x + 34, y + 12);   // right hip
    c.lineTo(x - 34, y + 12);   // left hip
    c.closePath();
  }, jersey);

  // Spine shadow down center (cel-shading hint)
  ctx.fillStyle = jerseyDark;
  ctx.fillRect(x - 4, y - 48, 8, 60);
  // Side shadow on left (lighting from upper-right)
  ctx.fillStyle = jerseyDark;
  ctx.beginPath();
  ctx.moveTo(x - 38, y - 48);
  ctx.lineTo(x - 26, y - 48);
  ctx.lineTo(x - 30, y + 12);
  ctx.lineTo(x - 34, y + 12);
  ctx.closePath();
  ctx.fill();

  // BIG jersey number on back - centered, bold outlined
  ctx.save();
  ctx.fillStyle = '#F5F1E8';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.font = 'bold 42px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText('9', x, y - 18);
  ctx.fillText('9', x, y - 18);
  ctx.restore();

  // Team name across shoulders (tiny detail - adds polish)
  ctx.save();
  ctx.fillStyle = '#F5F1E8';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.font = 'bold 11px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = (teamNameShort || 'TEAM').toUpperCase().substring(0, 8);
  ctx.strokeText(label, x, y - 40);
  ctx.fillText(label, x, y - 40);
  ctx.restore();

  // ---- Head (back of head, turned slightly left toward pitcher) ----
  const headX = x - 4;  // shifted slightly left (he's looking at pitcher on left)
  const headY = y - 70;

  // Neck (visible strip between helmet and jersey)
  outlinedRect(ctx, headX - 8, y - 54, 16, 8, skin);

  // Helmet (back view) - big dome with ear flap on left side (facing pitcher)
  outlinedCircle(ctx, headX, headY, 22, jersey);
  // Helmet shadow on right (back side from light)
  ctx.fillStyle = jerseyDark;
  ctx.beginPath();
  ctx.arc(headX, headY, 22, Math.PI * 1.7, Math.PI * 0.3);
  ctx.lineTo(headX, headY);
  ctx.closePath();
  ctx.fill();
  // Re-stroke helmet outline on top
  ctx.beginPath();
  ctx.arc(headX, headY, 22, 0, Math.PI * 2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Ear flap on left side (protecting the ear facing the pitcher)
  outlinedPath(ctx, (c) => {
    c.moveTo(headX - 18, headY - 4);
    c.lineTo(headX - 22, headY + 8);
    c.lineTo(headX - 16, headY + 14);
    c.lineTo(headX - 8, headY + 8);
    c.closePath();
  }, jersey);

  // Helmet logo dot (tiny center-of-back detail)
  ctx.fillStyle = jerseyLight;
  ctx.beginPath();
  ctx.arc(headX, headY - 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tiny sliver of cheek on left side (turning toward pitcher)
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(headX - 20, headY + 2, 4, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ---- Bat: held high, cocked over RIGHT shoulder (from batter's POV = RIGHT on screen since back view) ----
  // Pivot point: hands, roughly at right shoulder height
  const handsX = x + 30;
  const handsY = y - 42;
  // Hands (skin)
  outlinedCircle(ctx, handsX, handsY, 7, skin);
  outlinedCircle(ctx, handsX + 4, handsY - 2, 6, skin);

  // Arms wrap up to the hands
  // Right arm (near side of camera) - bent up to hands
  outlinedPath(ctx, (c) => {
    c.moveTo(x + 30, y - 46);      // right shoulder
    c.lineTo(x + 42, y - 42);      // upper arm
    c.lineTo(handsX + 2, handsY + 6);  // forearm to hands
    c.lineTo(handsX - 8, handsY + 6);
    c.closePath();
  }, jersey);
  // Left arm wraps across back
  outlinedPath(ctx, (c) => {
    c.moveTo(x - 34, y - 46);
    c.lineTo(x - 20, y - 46);
    c.lineTo(handsX - 4, handsY + 4);
    c.lineTo(x - 30, y - 36);
    c.closePath();
  }, jerseyDark);

  // Bat animation: at rest = cocked up-and-back (pointing up-right from hands)
  // Swing = sweeps across horizontally to left (toward pitcher)
  const t = batSwingT == null ? 0 : batSwingT;
  const startAngle = -Math.PI * 0.45;  // up and right (cocked over shoulder)
  const endAngle = -Math.PI * 1.15;    // extended left-and-up (toward pitcher)
  const angle = startAngle + (endAngle - startAngle) * t;

  ctx.save();
  ctx.translate(handsX, handsY);
  ctx.rotate(angle);
  // Bat shaft
  ctx.fillStyle = '#C9A36B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(60, -8);
  ctx.lineTo(82, -10);
  ctx.lineTo(82, 10);
  ctx.lineTo(60, 8);
  ctx.lineTo(0, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Wood grain shadow along bottom
  ctx.fillStyle = '#8B5E34';
  ctx.beginPath();
  ctx.moveTo(60, 3);
  ctx.lineTo(82, 4);
  ctx.lineTo(82, 10);
  ctx.lineTo(60, 8);
  ctx.closePath();
  ctx.fill();
  // Grip tape (black wrap)
  ctx.fillStyle = '#222';
  ctx.fillRect(0, -5, 16, 10);
  ctx.strokeRect(0, -5, 16, 10);
  // Knob
  ctx.beginPath();
  ctx.arc(-3, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#C9A36B';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Swing streak effect
  if (batSwingT != null && batSwingT > 0.1 && batSwingT < 0.9) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(handsX, handsY, 60, startAngle, angle, startAngle > angle);
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

      // Catcher-cam depth layering: far -> near
      // 1. Sky (furthest)
      drawSky(ctx);
      // 2. Stadium / outfield (far background)
      drawOutfield(ctx);
      // 3. Pitcher on the mound (mid-distance)
      drawPitcher(ctx, profile.teamColor?.primary);
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

      // 7. Batter (big foreground character)
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
      drawBatter(ctx, profile.teamColor?.primary || '#1f3a93', batT, profile.teamName);

      // 8. Catcher helmet peek at very bottom (foreground-most, confirms camera placement)
      drawCatcher(ctx);

      // 9. HUD overlay (bases inset)
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
    // Sweet spot centered at 0.92 (ball nearly at plate) with wider window
    const rawOffset = t - 0.92;
    const timing = Math.min(1, Math.abs(rawOffset) / 0.45);

    batRef.current = { startTime: Date.now(), duration: 260 };
    p.resolved = true;
    pitchRef.current = null;

    const result = calculateSwingResult(timing, p.pitch, currentBatter, swingType);
    // Add timing feedback on every swing so players learn
    if (rawOffset < -0.15) result.timingHint = 'Way too early!';
    else if (rawOffset < -0.05) result.timingHint = 'A little early';
    else if (rawOffset > 0.15) result.timingHint = 'Way too late!';
    else if (rawOffset > 0.05) result.timingHint = 'A little late';
    else result.timingHint = 'Good timing!';
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
