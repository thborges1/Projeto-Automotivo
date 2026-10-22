export const STORAGE_KEY = 'senai-automotivo-3d:v1';
export const defaultSettings = { quality: 'medium', sensitivity: 1, audio: false };
export class ProgressSystem {
  constructor(storage) {
    this.storage = storage; this.available = true;
    this.data = { visited: [], completed: {}, settings: { ...defaultSettings } };
    try {
      this.storage ||= globalThis.localStorage;
      const parsed = JSON.parse(this.storage.getItem(STORAGE_KEY) || 'null');
      if (parsed && typeof parsed === 'object') {
        this.data.visited = Array.isArray(parsed.visited) ? parsed.visited.filter(x => typeof x === 'string') : [];
        this.data.completed = Object.fromEntries(Object.entries(parsed.completed || {}).filter(([, v]) => v && typeof v === 'object' && Number.isFinite(v.score) && Number.isFinite(v.total)));
        const s = parsed.settings || {};
        this.data.settings = {
          quality: ['low', 'medium', 'high'].includes(s.quality) ? s.quality : 'medium',
          sensitivity: Number.isFinite(s.sensitivity) ? Math.min(2, Math.max(0.4, s.sensitivity)) : 1,
          audio: s.audio === true,
        };
      }
    } catch { this.available = false; }
  }
  save() { try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch { this.available = false; } }
  visit(id) { if (!this.data.visited.includes(id)) { this.data.visited.push(id); this.save(); } }
  complete(id, score, total) {
    this.data.completed[id] = { score, total, completedAt: new Date().toISOString() }; this.save();
  }
  settings(settings) { this.data.settings = { ...this.data.settings, ...settings }; this.save(); }
  reset() { this.data.visited = []; this.data.completed = {}; this.save(); }
}
