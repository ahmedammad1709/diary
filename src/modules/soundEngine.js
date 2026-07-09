let audioContext;
let ambientNodes;

export async function setAmbientSound(enabled) {
  const context = getAudioContext();

  if (context.state === 'suspended') {
    await context.resume();
  }

  if (!enabled) {
    stopAmbient();
    return;
  }

  if (ambientNodes) {
    return;
  }

  const low = context.createOscillator();
  const air = context.createOscillator();
  const gain = context.createGain();
  const airGain = context.createGain();

  low.type = 'sine';
  low.frequency.value = 58;
  air.type = 'triangle';
  air.frequency.value = 116;
  gain.gain.value = 0.018;
  airGain.gain.value = 0.006;

  low.connect(gain).connect(context.destination);
  air.connect(airGain).connect(context.destination);
  low.start();
  air.start();
  ambientNodes = { low, air, gain, airGain };
}

export function stopAmbient() {
  if (!ambientNodes) {
    return;
  }

  const context = getAudioContext();
  ambientNodes.gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);
  ambientNodes.airGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);
  window.setTimeout(() => {
    ambientNodes?.low.stop();
    ambientNodes?.air.stop();
    ambientNodes = null;
  }, 280);
}

export function playDiarySound(type) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  const preset = getPreset(type);
  oscillator.type = preset.wave;
  oscillator.frequency.setValueAtTime(preset.start, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(preset.end, context.currentTime + preset.duration);
  filter.type = 'lowpass';
  filter.frequency.value = preset.filter;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(preset.volume, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + preset.duration);

  oscillator.connect(filter).connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + preset.duration + 0.04);
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function getPreset(type) {
  switch (type) {
    case 'open':
      return { wave: 'triangle', start: 95, end: 180, duration: 0.55, volume: 0.04, filter: 900 };
    case 'sink':
      return { wave: 'sawtooth', start: 140, end: 45, duration: 0.72, volume: 0.035, filter: 620 };
    case 'spark':
      return { wave: 'sine', start: 920, end: 1800, duration: 0.24, volume: 0.025, filter: 2600 };
    case 'reply':
      return { wave: 'triangle', start: 210, end: 150, duration: 0.32, volume: 0.022, filter: 1200 };
    default:
      return { wave: 'sine', start: 180, end: 120, duration: 0.3, volume: 0.02, filter: 900 };
  }
}
