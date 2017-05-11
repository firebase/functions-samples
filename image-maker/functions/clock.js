const _ = require('lodash');

const getDefaultOpts = () => ({
  strokes: {
    clock: '#325FA2',
    hour: '#000000',
    minute: '#000000',
    seconds: '#D40000'
  },
  fills: {
    clock: '#eeeeee',
    tip: '#555555',
    seconds: '#D40000'
  }
});

const getX = (angle) => {
  return -Math.sin(angle + Math.PI)
};

const getY = (angle) => {
  return Math.cos(angle + Math.PI)
};

const clock = (ctx, colorOpts) => {
  const colors = _.merge({}, getDefaultOpts(), colorOpts);
  let x, y, i;
  const now = new Date();

  ctx.clearRect(0, 0, 320, 320);
  ctx.save();

  // Clock background
  ctx.translate(160, 160);
  ctx.beginPath();
  ctx.lineWidth = 14;
  ctx.strokeStyle = colors.strokes.clock;
  ctx.fillStyle = colors.fills.clock;
  ctx.arc(0, 0, 142, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.fill();

  // Hour marks
  ctx.lineWidth = 8;
  ctx.strokeStyle = colors.strokes.hour;
  for (i = 0; i < 12; i++) {
    x = getX(Math.PI / 6 * i);
    y = getY(Math.PI / 6 * i);
    ctx.beginPath();
    ctx.moveTo(x * 100, y * 100);
    ctx.lineTo(x * 125, y * 125);
    ctx.stroke();
  }

  // Minute marks
  ctx.lineWidth = 5;
  ctx.strokeStyle = colors.strokes.minute;
  for (i = 0; i < 60; i++) {
    if (i % 5 !== 0) {
      x = getX(Math.PI / 30 * i);
      y = getY(Math.PI / 30 * i);
      ctx.beginPath();
      ctx.moveTo(x * 117, y * 117);
      ctx.lineTo(x * 125, y * 125);
      ctx.stroke();
    }
  }

  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours() % 12;

  ctx.fillStyle = 'black';

  // Write hours
  x = getX(hr * (Math.PI / 6) + (Math.PI / 360) * min + (Math.PI / 21600) * sec);
  y = getY(hr * (Math.PI / 6) + (Math.PI / 360) * min + (Math.PI / 21600) * sec);
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(x * -20, y * -20);
  ctx.lineTo(x * 80, y * 80);
  ctx.stroke();

  // Write minutes
  x = getX((Math.PI / 30) * min + (Math.PI / 1800) * sec);
  y = getY((Math.PI / 30) * min + (Math.PI / 1800) * sec);

  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x * -28, y * -28);
  ctx.lineTo(x * 112, y * 112);
  ctx.stroke();

  // Write seconds
  x = getX(sec * Math.PI / 30);
  y = getY(sec * Math.PI / 30);
  ctx.strokeStyle = colors.strokes.seconds;
  ctx.fillStyle = colors.fills.seconds;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x * -30, y * -30);
  ctx.lineTo(x * 83, y * 83);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x * 95, y * 95, 10, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.fillStyle = colors.fills.tip;
  ctx.arc(0, 0, 3, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.restore();
}

module.exports = clock;
