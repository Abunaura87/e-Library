// Synthesizes a realistic physical paper page turn sound using Web Audio API

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playPaperFlipSound(enabled: boolean, variant: 'next' | 'prev' = 'next'): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const duration = 0.22;
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate shaped pink-like noise with a crisp paper friction envelope
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < frameCount; i++) {
      const t = i / frameCount;
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      const pink = b0 + b1 + b2 + white * 0.18;

      // Double-hump envelope: initial thumb lift + page settle snap
      const liftEnv = Math.sin(Math.min(1, t * 1.4) * Math.PI) * Math.pow(1 - t, 1.35);
      const snapEnv = t > 0.68 ? Math.sin(((t - 0.68) / 0.32) * Math.PI) * 0.28 : 0;
      data[i] = pink * (liftEnv + snapEnv);
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Bandpass filter sweeping frequency to mimic paper bend
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const startFreq = variant === 'next' ? 950 : 820;
    const peakFreq = variant === 'next' ? 2450 : 2100;
    filter.frequency.setValueAtTime(startFreq, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(peakFreq, ctx.currentTime + duration * 0.55);
    filter.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + duration);
    filter.Q.setValueAtTime(1.35, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.035);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start();
    noiseSource.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio context restriction errors if user hasn't interacted yet
  }
}
