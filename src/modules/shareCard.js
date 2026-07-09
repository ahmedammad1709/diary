export async function shareOmenCard({ reply, mood, effect, sealPreview }) {
  if (!reply) {
    throw new Error('The diary has not written an omen yet.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const context = canvas.getContext('2d');

  paintBackground(context, canvas.width, canvas.height, mood);
  paintFrame(context, canvas.width, canvas.height);
  paintText(context, reply, mood, effect);

  if (sealPreview) {
    await paintSeal(context, sealPreview);
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.96));
  const file = new File([blob], 'living-ink-diary-omen.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: 'The Living Ink Diary',
      text: 'The diary wrote back.',
      files: [file]
    });
    return 'The omen was offered to the outside world.';
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'living-ink-diary-omen.png';
  link.click();
  URL.revokeObjectURL(url);
  return 'The omen has been sealed into an image.';
}

function paintBackground(context, width, height, mood) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#261107');
  gradient.addColorStop(0.28, '#d9b16c');
  gradient.addColorStop(0.62, '#f0d99d');
  gradient.addColorStop(1, mood === 'angry' ? '#4a0d08' : '#5b3215');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = 'rgba(36, 12, 4, 0.15)';
  for (let index = 0; index < 420; index += 1) {
    const x = seeded(index * 31) * width;
    const y = seeded(index * 47) * height;
    const radius = 1 + seeded(index * 19) * 3;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function paintFrame(context, width, height) {
  context.strokeStyle = 'rgba(44, 13, 4, 0.62)';
  context.lineWidth = 22;
  context.strokeRect(62, 62, width - 124, height - 124);
  context.strokeStyle = 'rgba(255, 231, 168, 0.36)';
  context.lineWidth = 3;
  context.strokeRect(92, 92, width - 184, height - 184);

  context.fillStyle = 'rgba(25, 7, 3, 0.82)';
  context.font = '42px Georgia';
  context.textAlign = 'center';
  context.fillText('The Living Ink Diary', width / 2, 180);
}

function paintText(context, reply, mood, effect) {
  context.fillStyle = mood === 'angry' ? '#330804' : '#240803';
  context.shadowColor = effect === 'glow' ? 'rgba(255, 228, 145, 0.72)' : 'rgba(73, 7, 2, 0.28)';
  context.shadowBlur = effect === 'glow' ? 22 : 6;
  context.font = '58px Georgia';
  context.textAlign = 'left';

  const lines = wrapText(context, reply, 860);
  const lineHeight = 92;
  const startY = 610 - (lines.length * lineHeight) / 2;

  lines.forEach((line, index) => {
    context.fillText(line, 170, startY + index * lineHeight);
  });

  context.shadowBlur = 0;
  context.fillStyle = 'rgba(44, 12, 4, 0.58)';
  context.font = '28px Georgia';
  context.fillText(`mood: ${mood}  effect: ${effect}`, 170, 1280);
}

async function paintSeal(context, sealPreview) {
  const image = new Image();
  image.src = sealPreview;
  await image.decode();

  context.save();
  context.globalAlpha = 0.42;
  context.translate(820, 1120);
  context.rotate(-0.11);
  context.drawImage(image, 0, 0, 220, 180);
  context.restore();
}

function wrapText(context, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

function seeded(value) {
  const x = Math.sin(value) * 10000;
  return x - Math.floor(x);
}
