/**
 * Ambient sound engine (Web Audio) — no network needed.
 *
 * Two layers of realism:
 *  1. REAL RECORDINGS: if a looping file exists at /sounds/<id>.mp3 it's used
 *     directly (drop CC0 loops there to upgrade — see public/sounds/README.txt).
 *  2. PROCEDURAL FALLBACK: otherwise each ambience is synthesized from layered
 *     noise + scheduled events (rain droplets, ocean foam, café clinks, birdsong,
 *     fire crackle) so it actually resembles the thing, not flat noise.
 */
export const AMBIANCES = [
  { id: 'rain', label: 'Rain' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'fire', label: 'Fireplace' },
  { id: 'cafe', label: 'Café' },
  { id: 'forest', label: 'Forest' },
  { id: 'white', label: 'White noise' },
  { id: 'pink', label: 'Pink noise' },
  { id: 'brown', label: 'Brown noise' },
];

// Optional real recordings. Add loops here to upgrade automatically.
const REAL_FILES = {
  rain: '/sounds/rain.mp3',
  ocean: '/sounds/ocean.mp3',
  fire: '/sounds/fire.mp3',
  cafe: '/sounds/cafe.mp3',
  forest: '/sounds/forest.mp3',
};

function makeNoiseBuffer(ctx, type, seconds = 3) {
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < frames; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < frames; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function createAmbiance() {
  let ctx = null;
  let master = null;
  let audioEl = null;
  let sources = [];
  let oscs = [];
  let timers = [];
  let current = null;
  let volume = 0.5;

  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  };

  const stopSynth = () => {
    sources.forEach((s) => { try { s.stop(); } catch { /* noop */ } });
    oscs.forEach((o) => { try { o.stop(); } catch { /* noop */ } });
    timers.forEach((t) => clearInterval(t));
    sources = []; oscs = []; timers = [];
  };

  const stop = () => {
    if (audioEl) { try { audioEl.pause(); } catch { /* noop */ } audioEl.src = ''; audioEl = null; }
    stopSynth();
    current = null;
  };

  // --- building blocks ---------------------------------------------------
  const biquad = (type, freq, q) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q != null) f.Q.value = q;
    return f;
  };

  // A continuous noise layer through a filter chain, at a base gain.
  // Returns the gain node so callers can modulate its level.
  const layer = (type, filters, gainVal) => {
    const s = ctx.createBufferSource();
    s.buffer = makeNoiseBuffer(ctx, type);
    s.loop = true;
    const g = ctx.createGain();
    g.gain.value = gainVal;
    let n = s;
    filters.forEach((f) => { n.connect(f); n = f; });
    n.connect(g).connect(master);
    s.start();
    sources.push(s);
    return g;
  };

  // Slow sine LFO modulating an AudioParam around its base value.
  const lfo = (rate, depth, param) => {
    const osc = ctx.createOscillator();
    osc.frequency.value = rate;
    const g = ctx.createGain();
    g.gain.value = depth;
    osc.connect(g).connect(param);
    osc.start();
    oscs.push(osc);
  };

  // A short burst of filtered noise (a rain droplet, a café clink surface, etc.)
  const tick = (freq, dur, gainVal, q = 8) => {
    const frames = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 2);
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const f = biquad('bandpass', freq, q);
    const g = ctx.createGain();
    g.gain.value = gainVal;
    s.connect(f).connect(g).connect(master);
    s.start();
  };

  // A short tonal ping with a quick decay (cup clinks).
  const ping = (freq, dur, gainVal) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(gainVal, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur);
  };

  // A rising/falling chirp (birdsong).
  const chirp = () => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const t = ctx.currentTime;
    const base = 2200 + Math.random() * 1600;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.linearRampToValueAtTime(base + 700, t + 0.08);
    osc.frequency.linearRampToValueAtTime(base - 200, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume * 0.12, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.22);
  };

  const every = (ms, fn) => { const id = setInterval(fn, ms); timers.push(id); };

  // --- procedural ambiences ---------------------------------------------
  const procedural = (id) => {
    ensure();
    stopSynth();

    if (id === 'rain') {
      layer('white', [biquad('highpass', 1000), biquad('lowpass', 8200)], 0.42); // steady hiss
      every(38, () => { if (Math.random() < 0.85) tick(1400 + Math.random() * 4200, 0.02 + Math.random() * 0.03, volume * (0.05 + Math.random() * 0.12)); });
    } else if (id === 'ocean') {
      const oceanLp = biquad('lowpass', 600);
      const body = layer('brown', [oceanLp], 0.55);
      lfo(0.09, 300, oceanLp.frequency); // cutoff washes in and out
      lfo(0.09, 0.32, body.gain);        // volume swells with the wave
      // foam: brighter hiss that ebbs on a slightly different cycle
      const foam = layer('white', [biquad('highpass', 1900), biquad('lowpass', 9000)], 0.14);
      lfo(0.115, 0.14, foam.gain);
    } else if (id === 'fire') {
      layer('brown', [biquad('lowpass', 430)], 0.4); // rumble
      every(150, () => { if (Math.random() < 0.7) tick(900 + Math.random() * 2600, 0.03 + Math.random() * 0.05, volume * (0.25 + Math.random() * 0.55), 4); });
    } else if (id === 'cafe') {
      const cafeBp = biquad('bandpass', 480, 0.8);
      layer('pink', [cafeBp, biquad('lowpass', 1500)], 0.5); // room murmur
      lfo(0.13, 70, cafeBp.frequency);   // gentle spectral drift
      every(2600, () => { if (Math.random() < 0.5) ping(1600 + Math.random() * 1600, 0.25 + Math.random() * 0.3, volume * 0.06); });
    } else if (id === 'forest') {
      const windBp = biquad('bandpass', 650, 0.6);
      layer('pink', [windBp], 0.4); // wind through leaves
      lfo(0.06, 220, windBp.frequency);
      every(2400, () => { if (Math.random() < 0.55) chirp(); });
    } else if (id === 'white') {
      layer('white', [biquad('lowpass', 12000)], 0.34);
    } else if (id === 'pink') {
      layer('pink', [], 0.5);
    } else {
      layer('brown', [biquad('lowpass', 240)], 0.7);
    }

    current = id;
  };

  // --- public play: real file first, procedural fallback ----------------
  const play = (id) => {
    stop();
    current = id;
    const url = REAL_FILES[id];
    if (url && typeof Audio !== 'undefined') {
      const el = new Audio();
      el.loop = true;
      el.preload = 'auto';
      el.volume = volume;
      el.src = url;
      el.addEventListener('canplaythrough', () => {
        if (current !== id) return;
        el.play().catch(() => procedural(id));
      }, { once: true });
      el.addEventListener('error', () => { if (current === id) procedural(id); }, { once: true });
      audioEl = el;
      el.load();
    } else {
      procedural(id);
    }
  };

  const setVolume = (v) => {
    volume = v;
    if (master) master.gain.value = v;
    if (audioEl) audioEl.volume = v;
  };

  const getCurrent = () => current;

  const dispose = () => {
    stop();
    try { ctx && ctx.close(); } catch { /* noop */ }
    ctx = null;
    master = null;
  };

  return { play, stop, setVolume, getCurrent, dispose };
}
