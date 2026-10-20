// Night is painted onto the background before live players, balls and scores.
export function drawNightAtmosphere(ctx, width, height) {
  ctx.save();
  ctx.scale(width / 800, height / 500);
  const night = ctx.createLinearGradient(0, 0, 0, 500);
  night.addColorStop(0, 'rgba(3, 5, 26, 0.96)');
  night.addColorStop(0.42, 'rgba(6, 10, 33, 0.84)');
  night.addColorStop(0.65, 'rgba(7, 13, 30, 0.48)');
  night.addColorStop(1, 'rgba(9, 16, 34, 0.34)');
  ctx.fillStyle = night;
  ctx.fillRect(0, 0, 800, 500);
  // Fixed stars do not consume game randomness.
  ctx.fillStyle = '#e7edff';
  for (let i = 0; i < 34; i++) {
    ctx.globalAlpha = 0.35 + (i % 4) * 0.15;
    ctx.beginPath();
    ctx.arc((i * 137 + 37) % 800, 12 + (i * 31) % 90, i % 5 === 0 ? 1.2 : 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowColor = '#e3eaff';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#eef1d9';
  ctx.beginPath();
  ctx.arc(654, 46, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Lamp banks align with the two main towers in stadium.png.
  for (const bank of [{ x: 240, y: 150, w: 78, h: 20 }, { x: 525, y: 144, w: 32, h: 21 }]) {
    const beam = ctx.createLinearGradient(bank.x, bank.y, bank.x, 420);
    beam.addColorStop(0, 'rgba(235, 245, 255, 0.24)');
    beam.addColorStop(1, 'rgba(235, 245, 255, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(bank.x - bank.w / 2, bank.y);
    ctx.lineTo(bank.x + bank.w / 2, bank.y);
    ctx.lineTo(bank.x + 220, 420);
    ctx.lineTo(bank.x - 200, 420);
    ctx.closePath();
    ctx.fill();
    const glow = ctx.createRadialGradient(bank.x, bank.y, 1, bank.x, bank.y, bank.w * 0.9);
    glow.addColorStop(0, 'rgba(230, 243, 255, 0.5)');
    glow.addColorStop(1, 'rgba(230, 243, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(bank.x - bank.w, bank.y - bank.w, bank.w * 2, bank.w * 2);
    ctx.fillStyle = '#182135';
    ctx.fillRect(bank.x - bank.w / 2 - 3, bank.y - bank.h / 2 - 3, bank.w + 6, bank.h + 6);
    ctx.fillStyle = '#ffffed';
    ctx.shadowColor = '#effbff';
    ctx.shadowBlur = 10;
    const columns = bank.w > 40 ? 14 : 6;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < columns; col++) {
        ctx.beginPath();
        ctx.arc(bank.x - bank.w / 2 + col * bank.w / (columns - 1), bank.y - 7 + row * 7, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

export function drawNightStadium(ctx, image, width, height) {
  ctx.drawImage(image, 0, 0, width, height);
  drawNightAtmosphere(ctx, width, height);
}
