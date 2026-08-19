/**
 * Self-contained ambient sound generator using the Web Audio API — no audio
 * files or network needed. Returns a controller you can start/stop and set volume on.
 */
export const AMBIANCES = [
  { id: 'rain', label: 'Rain' },
  { id: 'fire', label: 'Fireplace' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'cafe', label: 'Café hum' },
  { id: 'brown', label: 'Deep hush' },
];

function makeNoiseBuffer(ctx, seconds = 2) {
  const frames = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < frames; i++) {
    const white = Math.random() * 2 - 1;
    // brown-ish integration for a softer noise floor
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

export function createAmbiance() {
  let ctx = null;
  let src = null;
  let filter = null;
  let gain = null;
  let lfo = null;
  let lfoGain = null;
  let crackleTimer = null;
  let current = null;
  let volume = 0.5;

  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    }
  };

  const stop = () => {
    try { src && src.stop(); } catch { /* already stopped */ }
    try { lfo && lfo.stop(); } catch { /* noop */ }
    if (crackleTimer) { clearInterval(crackleTimer); crackleTimer = null; }
    src = filter = gain = lfo = lfoGain = null;
    current = null;
  };

  // A single short "pop" of filtered noise, for the fireplace crackle.
  const crackle = () => {
    if (!ctx) return;
    const frames = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 3);
    const b = ctx.createBufferSource();
    b.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = volume * (0.25 + Math.random() * 0.5);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1200 + Math.random() * 2200;
    b.connect(f).connect(g).connect(ctx.destination);
    b.start();
  };

  const play = (id) => {
    ensure();
    stop();
    if (ctx.state === 'suspended') ctx.resume();

    src = ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(ctx);
    src.loop = true;

    filter = ctx.createBiquadFilter();
    gain = ctx.createGain();
    gain.gain.value = volume;

    if (id === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
    } else if (id === 'fire') {
      filter.type = 'lowpass';
      filter.frequency.value = 620;
      crackleTimer = setInterval(() => { if (Math.random() < 0.6) crackle(); }, 170);
    } else if (id === 'brown') {
      filter.type = 'lowpass';
      filter.frequency.value = 500;
    } else if (id === 'cafe') {
      filter.type = 'bandpass';
      filter.frequency.value = 700;
      filter.Q.value = 0.6;
    } else if (id === 'ocean') {
      // slow swell via an LFO on the gain
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;
      lfoGain = ctx.createGain();
      lfoGain.gain.value = volume * 0.5;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start();
    }

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    current = id;
  };

  const setVolume = (v) => {
    volume = v;
    if (gain) gain.gain.value = v;
    if (lfoGain) lfoGain.gain.value = v * 0.5;
  };

  const getCurrent = () => current;

  const dispose = () => {
    stop();
    try { ctx && ctx.close(); } catch { /* noop */ }
    ctx = null;
  };

  return { play, stop, setVolume, getCurrent, dispose };
}
