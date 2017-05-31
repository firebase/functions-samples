const render = (min, max, ctx, posObject) => {
  ctx.fillStyle = getPointColor(122, 122);
  ctx.fillRect(0, 0, 240, 240);
  renderLevel(min, max, 0, ctx);
  ctx.translate(posObject.x, posObject.y);
};

const renderLevel = (minimumLevel, level, y, ctx) => {
  let x;

  for (x = 0; x < 243 / level; ++x) {
    drawBlock(x, y, level, ctx);
  }
  for (x = 0; x < 243 / level; x += 3) {
    drawBlock(x, y + 1, level, ctx);
    drawBlock(x + 2, y + 1, level, ctx);
  }
  for (x = 0; x < 243 / level; ++x) {
    drawBlock(x, y + 2, level, ctx);
  }
  if ((y += 3) >= 243 / level) {
    y = 0;
    level /= 3;
  }
  if (level >= minimumLevel) {
    renderLevel(minimumLevel, level, y, ctx);
  }
};

const drawBlock = (x, y, level, ctx) => {
  ctx.fillStyle = getPointColor(
    x * level + (level - 1) / 2,
    y * level + (level - 1) / 2
  );

  ctx.fillRect(
    x * level,
    y * level,
    level,
    level
  );
};

const getPointColor = (x, y) => {
  x = x / 121.5 - 1;
  y = -y / 121.5 + 1;

  const x2y2 = x * x + y * y;
  if (x2y2 > 1) {
    return '#000';
  }

  const root = Math.sqrt(1 - x2y2);
  const x3d = x * 0.7071067812 + root / 2 - y / 2;
  const y3d = x * 0.7071067812 - root / 2 + y / 2;
  const z3d = 0.7071067812 * root + 0.7071067812 * y;
  let brightness = -x / 2 + root * 0.7071067812 + y / 2;
  if (brightness < 0) brightness = 0;

  const r = Math.round(brightness * 127.5 * (1 - y3d));
  const g = Math.round(brightness * 127.5 * (x3d + 1));
  const b = Math.round(brightness * 127.5 * (z3d + 1));

  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

module.exports = render;
