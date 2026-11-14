/**
 * =============================================================================
 * src/audio.js — Complete Audio Engine for "Side B"
 *
 * Supports real MP3 playback from ./public/audio/ with high-quality Web Audio API
 * procedural synthesis fallbacks for all SFX, footsteps, and background guitar.
 *
 * Exported API:
 *   initAudio()                – Initialize AudioContext on first user gesture
 *   playSound(name)            – Fire a one-shot SFX
 *   playVoiceAudio(name, cb)   – Play voice track (tapes/monologue) with onEnded callback
 *   startLoop(name)            – Start looping sound, returns handle { stop() }
 *   stopLoop(target)           – Stop looping sound by name or handle
 *   startBGGuitar()            – Start ambient fingerpicked guitar loop (vol: 0.22)
 *   stopBGGuitar()             – Stop background guitar loop
 *   duckBGGuitar(ducked)       – Smoothly lower/restore guitar volume (during speech)
 *   playFootstep()             – Soft wooden floor step sound (~0.48s cadence)
 *   updateProximityShimmer(d)  – Subtle harmonic guidance when within 2.2m of a tape
 *   setMuted(bool)             – Mute/unmute all audio
 *   isMuted()                  – Returns mute state
 * =============================================================================
 */

let audioCtx = null;
let masterGain = null;
let bgGuitarGain = null;
let isAudioMuted = false;

// Cache for decoded AudioBuffers
const audioBufferCache = new Map();
const failedAudioFiles = new Set();

// Known audio files on disk (all other SFX use high-quality procedural Web Audio synthesis)
const DISK_AUDIO_FILES = new Set([
  'tape1_side_a.mp3',
  'tape1_side_b.mp3',
  'tape2_side_a.mp3',
  'tape2_side_b.mp3',
  'tape3_side_a.mp3',
  'tape3_side_b.mp3',
  'final-monologue1.mp3',
  'final-monologue2.mp3',
  'final-monologue3.mp3',
  'final-monologue4.mp3',
]);

// Active named loops registry
const activeNamedLoops = new Map();

// Background guitar loop state
let bgGuitarSource = null;
let bgGuitarProceduralTimer = null;
let isBGGuitarPlaying = false;

/**
 * Initialize AudioContext (must be called from a user gesture)
 */
export function initAudio() {
  if (audioCtx) return audioCtx;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();

  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(isAudioMuted ? 0 : 1, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);

  bgGuitarGain = audioCtx.createGain();
  bgGuitarGain.gain.setValueAtTime(0.22, audioCtx.currentTime);
  bgGuitarGain.connect(masterGain);

  return audioCtx;
}

/**
 * Fetch and decode an audio file from ./public/audio/
 */
async function loadAudioBuffer(filename) {
  if (!audioCtx) return null;
  if (!DISK_AUDIO_FILES.has(filename)) return null;

  const path = `./public/audio/${filename}`;
  if (audioBufferCache.has(path)) {
    return audioBufferCache.get(path);
  }
  if (failedAudioFiles.has(path)) {
    return null;
  }

  try {
    const res = await fetch(path);
    if (!res.ok) {
      failedAudioFiles.add(path);
      return null;
    }
    const arrayBuf = await res.arrayBuffer();
    const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
    audioBufferCache.set(path, audioBuf);
    return audioBuf;
  } catch (err) {
    failedAudioFiles.add(path);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. ONE-SHOT SFX & PROCEDURAL FALLBACKS
// ---------------------------------------------------------------------------

/**
 * Play a one-shot sound (checks ./public/audio/<name>.mp3 first, then synth)
 */
export async function playSound(name) {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Try real MP3 first if not known to fail
  const filename = name.endsWith('.mp3') ? name : `${name}.mp3`;
  const buffer = await loadAudioBuffer(filename);

  if (buffer) {
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(masterGain);
    src.start();
    return;
  }

  // Web Audio Procedural Fallback
  playSynthesizedSFX(name);
}

function playSynthesizedSFX(name) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  switch (name) {
    case 'tape_click': {
      // Crisp mechanical plastic switch click
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      filter.Q.value = 3.5;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(filter).connect(gain).connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.035);
      break;
    }

    case 'padlock_dial': {
      // Sharp metallic ratchet tick
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = 5200;
      filter.Q.value = 9.0;

      osc.type = 'square';
      osc.frequency.setValueAtTime(4800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.022);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

      osc.connect(filter).connect(gain).connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.022);
      break;
    }

    case 'padlock_open': {
      // Double-click brass shackle pop
      [0, 0.075].forEach((delay, idx) => {
        const t = now + delay;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        filter.type = 'bandpass';
        filter.frequency.value = idx === 0 ? 1800 : 1200;
        filter.Q.value = 4.0;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 1600 : 900, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.06);

        gain.gain.setValueAtTime(0.65, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(filter).connect(gain).connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.06);
      });
      break;
    }

    case 'paper_rustle': {
      // Soft filtered noise burst resembling paper unfolding
      const bufferSize = audioCtx.sampleRate * 0.22;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600;
      filter.Q.value = 1.2;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      whiteNoise.connect(filter).connect(gain).connect(masterGain);
      whiteNoise.start(now);
      break;
    }

    case 'tape_static_burst': {
      // Short crackle burst on entering splice window
      const dur = 0.14;
      const bufferSize = audioCtx.sampleRate * dur;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 800;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(filter).connect(gain).connect(masterGain);
      noise.start(now);
      break;
    }

    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// 2. FOOTSTEP SOUND GENERATOR (Every ~0.48s while walking)
// ---------------------------------------------------------------------------

let lastFootstepTime = 0;

/**
 * Play a subtle wooden floor footstep sound
 */
export async function playFootstep() {
  if (!audioCtx) initAudio();
  const now = audioCtx.currentTime;
  if (now - lastFootstepTime < 0.42) return; // Debounce stride cadence
  lastFootstepTime = now;

  // Try real footstep MP3 first
  const buffer = await loadAudioBuffer('footstep.mp3');
  if (buffer) {
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.35 + Math.random() * 0.1;
    src.connect(gain).connect(masterGain);
    src.start();
    return;
  }

  // Procedural soft wooden floor step
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  const startFreq = 85 + (Math.random() - 0.5) * 15;
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

  filter.type = 'lowpass';
  filter.frequency.value = 350;

  gain.gain.setValueAtTime(0.18 + Math.random() * 0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(filter).connect(gain).connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.09);
}

// ---------------------------------------------------------------------------
// 3. VOICE AUDIO PLAYER (Tapes & Final Monologues)
// ---------------------------------------------------------------------------

/**
 * Play voice audio file with completion callback
 * Returns a handle { stop() }
 */
export async function playVoiceAudio(filename, onEnded) {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Duck background guitar while speech is playing
  duckBGGuitar(true);

  const realFilename = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
  const buffer = await loadAudioBuffer(realFilename);

  if (!buffer) {
    console.warn(`[Audio] Voice file not found: ${realFilename}`);
    if (onEnded) setTimeout(onEnded, 1500);
    return { stop() {} };
  }

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  const voiceGain = audioCtx.createGain();
  voiceGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
  src.connect(voiceGain).connect(masterGain);

  let hasEnded = false;
  function handleEnd() {
    if (hasEnded) return;
    hasEnded = true;
    duckBGGuitar(false);
    if (onEnded) onEnded();
  }

  src.onended = handleEnd;
  src.start();

  return {
    stop() {
      if (hasEnded) return;
      hasEnded = true;
      try { src.stop(); } catch (_) {}
      duckBGGuitar(false);
    },
  };
}

// ---------------------------------------------------------------------------
// 4. LOOPING SOUND ENGINE (Tape rewinds, static hiss, room tone)
// ---------------------------------------------------------------------------

export async function startLoop(name) {
  if (!audioCtx) initAudio();
  stopLoop(name);

  let stopped = false;
  const loopEntry = {
    handle: null,
    stop() {
      stopped = true;
      if (this.handle && typeof this.handle.stop === 'function') {
        this.handle.stop();
      }
    },
  };
  activeNamedLoops.set(name, loopEntry);

  const filename = name.endsWith('.mp3') ? name : `${name}.mp3`;
  const buffer = await loadAudioBuffer(filename);
  if (stopped) return loopEntry;

  if (buffer) {
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(masterGain);
    src.start();
    const handle = {
      stop() {
        try { src.stop(); } catch (_) {}
      },
    };
    loopEntry.handle = handle;
    return handle;
  }

  // Procedural loop fallbacks
  let handle = null;
  if (name === 'tape_rewind_loop') {
    handle = createRewindLoop();
  } else if (name === 'tape_static_loop') {
    handle = createStaticLoop();
  } else if (name === 'room_ambience') {
    handle = createAmbienceLoop();
  }

  if (handle) {
    loopEntry.handle = handle;
    return handle;
  }

  return loopEntry;
}

export function stopLoop(target) {
  if (!target) return;
  if (typeof target === 'string') {
    const entry = activeNamedLoops.get(target);
    if (entry) {
      entry.stop();
      activeNamedLoops.delete(target);
    }
    return;
  }
  if (typeof target.stop === 'function') {
    target.stop();
    for (const [name, entry] of activeNamedLoops.entries()) {
      if (entry === target || entry.handle === target) {
        activeNamedLoops.delete(name);
        break;
      }
    }
  }
}

function createRewindLoop() {
  const osc = audioCtx.createOscillator();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, audioCtx.currentTime);

  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(2.2, audioCtx.currentTime);
  lfoGain.gain.setValueAtTime(25, audioCtx.currentTime);
  lfo.connect(lfoGain).connect(osc.frequency);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(450, audioCtx.currentTime);
  filter.Q.setValueAtTime(1.8, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.28, audioCtx.currentTime);

  osc.connect(filter).connect(gain).connect(masterGain);
  osc.start();
  lfo.start();

  return {
    stop() {
      try {
        osc.stop();
        lfo.stop();
      } catch (_) {}
    },
  };
}

function createStaticLoop() {
  const bufLen = audioCtx.sampleRate * 2;
  const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2200, audioCtx.currentTime);
  filter.Q.setValueAtTime(0.8, audioCtx.currentTime);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.09, audioCtx.currentTime);

  src.connect(filter).connect(gain).connect(masterGain);
  src.start();

  return {
    stop() {
      try { src.stop(); } catch (_) {}
    },
  };
}

function createAmbienceLoop() {
  const bufLen = audioCtx.sampleRate * 2;
  const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < bufLen; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (last + 0.02 * white) / 1.02;
    last = data[i];
  }

  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(180, audioCtx.currentTime);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.06, audioCtx.currentTime);

  src.connect(filter).connect(gain).connect(masterGain);
  src.start();

  return {
    stop() {
      try { src.stop(); } catch (_) {}
    },
  };
}

// ---------------------------------------------------------------------------
// 5. WARM SEARCH BACKGROUND GUITAR ENGINE (G Major Fingerpicked Arpeggio)
// ---------------------------------------------------------------------------

/**
 * Pluck a single guitar note using damped harmonic synthesis (warm nylon acoustic feel)
 */
function playPluckedNote(freq, time, duration = 2.4, velocity = 0.7) {
  if (!audioCtx) return;

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const noteGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, time);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 5.5, time);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.2, time + duration);

  const baseAmp = velocity * 0.18;
  noteGain.gain.setValueAtTime(0.001, time);
  noteGain.gain.linearRampToValueAtTime(baseAmp, time + 0.015);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(noteGain).connect(bgGuitarGain);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration);
  osc2.stop(time + duration);
}

/**
 * Start background acoustic guitar loop
 */
export async function startBGGuitar() {
  if (isBGGuitarPlaying) return;
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  isBGGuitarPlaying = true;

  // Try real background guitar MP3 first
  const buffer = await loadAudioBuffer('bg_guitar.mp3');
  if (buffer && isBGGuitarPlaying) {
    bgGuitarSource = audioCtx.createBufferSource();
    bgGuitarSource.buffer = buffer;
    bgGuitarSource.loop = true;
    bgGuitarSource.connect(bgGuitarGain);
    bgGuitarSource.start();
    return;
  }

  // Procedural warm fingerpicked acoustic guitar in G major (G - Em - C - D)
  // Notes: G3=196.00, B3=246.94, D4=293.66, G4=392.00, E3=164.81, C4=261.63, E4=329.63, A3=220.00, F#4=369.99
  const pattern = [
    // G major bar (G3 - D4 - G4 - B3 - D4 - G4)
    { f: 196.00, beat: 0.00 },
    { f: 293.66, beat: 0.40 },
    { f: 392.00, beat: 0.80 },
    { f: 246.94, beat: 1.20 },
    { f: 293.66, beat: 1.60 },
    { f: 392.00, beat: 2.00 },

    // E minor bar (E3 - B3 - E4 - G3 - B3 - E4)
    { f: 164.81, beat: 2.60 },
    { f: 246.94, beat: 3.00 },
    { f: 329.63, beat: 3.40 },
    { f: 196.00, beat: 3.80 },
    { f: 246.94, beat: 4.20 },
    { f: 329.63, beat: 4.60 },

    // C major bar (C3 - G3 - E4 - C4 - G3 - E4)
    { f: 130.81, beat: 5.20 },
    { f: 196.00, beat: 5.60 },
    { f: 329.63, beat: 6.00 },
    { f: 261.63, beat: 6.40 },
    { f: 196.00, beat: 6.80 },
    { f: 329.63, beat: 7.20 },

    // D major bar (D3 - A3 - F#4 - D4 - A3 - F#4)
    { f: 146.83, beat: 7.80 },
    { f: 220.00, beat: 8.20 },
    { f: 369.99, beat: 8.60 },
    { f: 293.66, beat: 9.00 },
    { f: 220.00, beat: 9.40 },
    { f: 369.99, beat: 9.80 },
  ];

  const LOOP_DURATION = 10.4; // seconds per cycle

  function schedulePattern(startAudioTime) {
    if (!isBGGuitarPlaying) return;

    for (const note of pattern) {
      const noteTime = startAudioTime + note.beat;
      playPluckedNote(note.f, noteTime, 2.2, 0.72);
    }

    const nextCycleTime = startAudioTime + LOOP_DURATION;
    const msUntilNext = (nextCycleTime - audioCtx.currentTime - 0.25) * 1000;

    bgGuitarProceduralTimer = setTimeout(() => {
      schedulePattern(nextCycleTime);
    }, Math.max(10, msUntilNext));
  }

  schedulePattern(audioCtx.currentTime + 0.1);
}

/**
 * Stop background guitar
 */
export function stopBGGuitar() {
  isBGGuitarPlaying = false;
  if (bgGuitarProceduralTimer) {
    clearTimeout(bgGuitarProceduralTimer);
    bgGuitarProceduralTimer = null;
  }
  if (bgGuitarSource) {
    try { bgGuitarSource.stop(); } catch (_) {}
    bgGuitarSource = null;
  }
}

/**
 * Smoothly duck background guitar volume during speech or restore it
 */
export function duckBGGuitar(ducked) {
  if (!bgGuitarGain || !audioCtx) return;
  const target = ducked ? 0.05 : 0.22;
  bgGuitarGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.4);
}

// ---------------------------------------------------------------------------
// 6. GLOBAL MUTE / UNMUTE
// ---------------------------------------------------------------------------

export function setMuted(val) {
  isAudioMuted = !!val;
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(isAudioMuted ? 0 : 1, audioCtx.currentTime, 0.03);
  }
}

export function isMuted() {
  return isAudioMuted;
}

// ---------------------------------------------------------------------------
// 7. SPATIAL HARMONIC SHIMMER (Tape Proximity Guidance)
// ---------------------------------------------------------------------------
let shimmerNodes = null;

function ensureShimmer() {
  if (!audioCtx) return null;
  if (shimmerNodes) return shimmerNodes;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);

  // Soft pulsing LFO for gentle breathing effect
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(1.4, audioCtx.currentTime); // 1.4 Hz gentle shimmer pulse
  lfoGain.gain.setValueAtTime(0.38, audioCtx.currentTime);
  lfo.connect(lfoGain);

  const lfoModGain = audioCtx.createGain();
  lfoModGain.gain.setValueAtTime(0.62, audioCtx.currentTime);
  lfoGain.connect(lfoModGain.gain);

  // E minor 9th / G major harmonic overtone frequencies (dreamy, emotional chime)
  const freqs = [659.25, 783.99, 987.77, 1318.5]; // E5, G5, B5, E6
  const oscs = [];

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(920, audioCtx.currentTime);
  filter.Q.setValueAtTime(2.0, audioCtx.currentTime);

  freqs.forEach((f, idx) => {
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f + (idx % 2 === 0 ? 0.75 : -0.75), audioCtx.currentTime);
    oscGain.gain.setValueAtTime(0.18 / freqs.length, audioCtx.currentTime);
    osc.connect(oscGain).connect(filter);
    osc.start();
    oscs.push(osc);
  });

  lfo.start();

  filter.connect(lfoModGain).connect(gain).connect(masterGain);

  shimmerNodes = { gain, oscs, lfo };
  return shimmerNodes;
}

/**
 * Update subtle spatial harmonic shimmer based on distance to nearest uncollected tape
 * @param {number} distance - Distance in meters to closest uncollected tape
 */
export function updateProximityShimmer(distance) {
  if (!audioCtx || isAudioMuted) return;
  const nodes = ensureShimmer();
  if (!nodes) return;

  const now = audioCtx.currentTime;
  if (typeof distance === 'number' && distance < 2.2 && distance >= 0) {
    const norm = (2.2 - distance) / 2.2; // 0 (at 2.2m) to 1.0 (at 0m)
    const targetGain = Math.pow(norm, 1.4) * 0.14;
    nodes.gain.gain.setTargetAtTime(targetGain, now, 0.12);
  } else {
    nodes.gain.gain.setTargetAtTime(0.0001, now, 0.25);
  }
}
