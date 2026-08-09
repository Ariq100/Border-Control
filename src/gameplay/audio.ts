/**
 * Game-over audio, synthesised so the project needs no sound assets.
 * `pan` places the scream: -1 is the Entry gate side, +1 the detention side.
 */
export function playScream(pan: number, duration = 2.2) {
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return () => {};

  let ctx: AudioContext;
  try {
    ctx = new Ctx();
  } catch {
    return () => {};
  }

  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.0001;
  const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  if (panner) {
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    out.connect(panner).connect(ctx.destination);
  } else {
    out.connect(ctx.destination);
  }

  // voiced part: a wavering cry that breaks upward then collapses
  const voice = ctx.createOscillator();
  voice.type = 'sawtooth';
  voice.frequency.setValueAtTime(430, now);
  voice.frequency.exponentialRampToValueAtTime(880, now + 0.18);
  voice.frequency.exponentialRampToValueAtTime(620, now + 0.9);
  voice.frequency.exponentialRampToValueAtTime(180, now + duration);

  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 11;
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 42;
  vibrato.connect(vibratoGain).connect(voice.frequency);

  const throat = ctx.createBiquadFilter();
  throat.type = 'bandpass';
  throat.frequency.value = 1250;
  throat.Q.value = 3.2;
  voice.connect(throat).connect(out);

  // breath/rasp layer
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const hiss = ctx.createBiquadFilter();
  hiss.type = 'highpass';
  hiss.frequency.value = 900;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.18;
  noise.connect(hiss).connect(noiseGain).connect(out);

  out.gain.exponentialRampToValueAtTime(0.5, now + 0.06);
  out.gain.setValueAtTime(0.5, now + duration * 0.55);
  out.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  voice.start(now);
  vibrato.start(now);
  noise.start(now);
  voice.stop(now + duration);
  vibrato.stop(now + duration);
  noise.stop(now + duration);

  return () => {
    try {
      voice.stop();
      vibrato.stop();
      noise.stop();
      void ctx.close();
    } catch {
      /* already stopped */
    }
  };
}
