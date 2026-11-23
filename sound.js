(function (global) {
  'use strict';

  class SoundEngine {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    ensureContext() {
      if (!this.enabled) return null;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    playTick(pitchMultiplier = 1) {
      const ctx = this.ensureContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620 * pitchMultiplier, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.032);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } catch (_) {}
    }

    playWin() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        const now = ctx.currentTime;
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const start = now + i * 0.075;
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(0.11, start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.35);
        });
      } catch (_) {}
    }

    playComplete() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      try {
        const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
        const now = ctx.currentTime;
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          const start = now + i * 0.08;
          osc.frequency.setValueAtTime(freq, start);

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.36);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.4);
        });
      } catch (_) {}
    }

    playAlarm() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        for (let pulse = 0; pulse < 3; pulse++) {
          const base = now + pulse * 0.42;
          [880, 1108.73].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const start = base + idx * 0.14;
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.001, start);
            gain.gain.linearRampToValueAtTime(0.14, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + 0.25);
          });
        }
      } catch (_) {}
    }
  }

  global.RoletaSound = new SoundEngine();
})(window);
