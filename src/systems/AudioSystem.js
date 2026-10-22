export class AudioSystem {
  constructor() { this.enabled = false; this.context = null; }
  async play(success = false) {
    if (!this.enabled) return;
    try {
      this.context ||= new (window.AudioContext || window.webkitAudioContext)();
      await this.context.resume();
      const osc = this.context.createOscillator(), gain = this.context.createGain();
      osc.type = 'sine'; osc.frequency.value = success ? 660 : 420;
      gain.gain.setValueAtTime(0.025, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.14);
      osc.connect(gain); gain.connect(this.context.destination);
      osc.start(); osc.stop(this.context.currentTime + 0.15);
    } catch { /* Áudio opcional: indisponibilidade não interrompe a aprendizagem. */ }
  }
  dispose() { this.context?.close(); }
}
