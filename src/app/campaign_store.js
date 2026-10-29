/**
 * @file campaign_store.js
 * Manages the World Quest Campaign progression, levels, stars, and completion state.
 * Fully client-side, persisted in localStorage.
 */

export const CAMPAIGN_WORLDS = Object.freeze([
  {
    id: 'w1',
    name: 'Whispering Woods',
    desc: 'Gentle green trails with bright light and friendly turns.',
    icon: '🌲',
    theme: 'jungle',
    levels: [
      { id: 1, name: 'Sunny Glade', code: 'v1/15x15/bkt/GLADE1/b0/t0/scn', size: '15x15', parTime: 20 },
      { id: 2, name: 'Breezy Hollow', code: 'v1/17x17/bkt/HOLLOW2/b10/t0/scn', size: '17x17', parTime: 25 },
      { id: 3, name: 'Ancient Oak', code: 'v1/21x21/prm/OAK3/b15/t5/scn', size: '21x21', parTime: 30 },
    ],
  },
  {
    id: 'w2',
    name: 'Sunken Bridges',
    desc: 'Winding wooden planks over clear water and hidden lanterns.',
    icon: '🌊',
    theme: 'sheet',
    levels: [
      { id: 4, name: 'Plank Pathway', code: 'v1/21x21/bkt/PLANK4/b10/t10/srv', size: '21x21', parTime: 35 },
      { id: 5, name: 'Twin Canals', code: 'v1/25x25/krk/CANAL5/b20/t15/srv', size: '25x25', parTime: 40 },
      { id: 6, name: 'Harbor Gate', code: 'v1/27x27/wil/HARBOR6/b25/t15/srv', size: '27x27', parTime: 45 },
    ],
  },
  {
    id: 'w3',
    name: 'Muddy Marshes',
    desc: 'Sticky mud patches that test your stamina! Race The Hound.',
    icon: '🌾',
    theme: 'jungle',
    levels: [
      { id: 7, name: 'Slippery Slough', code: 'v1/27x27/bkt/SLOUGH7/b15/t25/srv', size: '27x27', parTime: 50 },
      { id: 8, name: 'Willow Bog', code: 'v1/31x31/prm/BOG8/b20/t25/srv', size: '31x31', parTime: 55 },
      { id: 9, name: 'Hound Marsh', code: 'v1/31x31/krk/HOUND9/b25/t30/pth', size: '31x31', parTime: 60 },
    ],
  },
  {
    id: 'w4',
    name: 'Crumbling Castle',
    desc: 'Ancient stone passages that collapse into rubble behind you.',
    icon: '🏰',
    theme: 'sheet',
    levels: [
      { id: 10, name: 'Courtyard Maze', code: 'v1/33x33/bkt/CASTLE10/b20/t20/pth', size: '33x33', parTime: 65 },
      { id: 11, name: 'Knight Gallery', code: 'v1/37x37/wil/KNIGHT11/b25/t25/pth', size: '37x37', parTime: 75 },
      { id: 12, name: 'Dungeon Vault', code: 'v1/41x41/div/VAULT12/b30/t25/pth', size: '41x41', parTime: 85 },
    ],
  },
  {
    id: 'w5',
    name: 'Starry Labyrinth',
    desc: 'The ultimate twilight maze with dim lanterns and 5 robot racers!',
    icon: '🌌',
    theme: 'cyber',
    levels: [
      { id: 13, name: 'Constellation Run', code: 'v1/45x45/bkt/STAR13/b25/t20/nmr', size: '45x45', parTime: 95 },
      { id: 14, name: 'Supernova Spiral', code: 'v1/51x51/krk/NOVA14/b30/t25/nmr', size: '51x51', parTime: 110 },
      { id: 15, name: 'Infinity Core', code: 'v1/61x61/wil/CORE15/b35/t30/nmr', size: '61x61', parTime: 130 },
    ],
  },
]);

const STORAGE_KEY = 'expedition_campaign_v1';

export class CampaignStore {
  constructor() {
    this._data = this._load();
  }

  _load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to read campaign data from localStorage', e);
    }
    // Default initial state: Level 1 is unlocked, everything else locked
    return {
      unlockedLevel: 1,
      scores: {}, // levelId -> { stars: 1..3, highScore: number, bestTime: number }
    };
  }

  _save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
      }
    } catch (e) {
      console.warn('Failed to save campaign data', e);
    }
  }

  isUnlocked(levelId) {
    return levelId <= (this._data.unlockedLevel || 1);
  }

  getLevelRecord(levelId) {
    return this._data.scores[levelId] || null;
  }

  get completedCount() {
    return Object.keys(this._data.scores).length;
  }

  get totalStars() {
    let sum = 0;
    for (const id in this._data.scores) {
      sum += this._data.scores[id]?.stars || 0;
    }
    return sum;
  }

  get totalLevels() {
    let count = 0;
    for (const w of CAMPAIGN_WORLDS) {
      count += w.levels.length;
    }
    return count;
  }

  recordLevelCompletion(levelId, score, elapsedSeconds) {
    const level = this.findLevel(levelId);
    if (!level) return;

    // Calculate stars: 3 stars if score >= 800 and time <= parTime, 2 stars if score >= 600, 1 star otherwise
    let stars = 1;
    if (score >= 800 || (level.parTime && elapsedSeconds <= level.parTime)) {
      stars = 3;
    } else if (score >= 600) {
      stars = 2;
    }

    const current = this._data.scores[levelId];
    const prevStars = current?.stars || 0;
    const prevScore = current?.highScore || 0;
    const prevTime = current?.bestTime || Infinity;

    this._data.scores[levelId] = {
      stars: Math.max(prevStars, stars),
      highScore: Math.max(prevScore, score),
      bestTime: Math.min(prevTime, elapsedSeconds),
    };

    // Unlock next level
    if (levelId === this._data.unlockedLevel && levelId < this.totalLevels) {
      this._data.unlockedLevel = levelId + 1;
    }

    this._save();
    return this._data.scores[levelId];
  }

  findLevel(levelId) {
    for (const w of CAMPAIGN_WORLDS) {
      for (const l of w.levels) {
        if (l.id === levelId) return l;
      }
    }
    return null;
  }

  reset() {
    this._data = { unlockedLevel: 1, scores: {} };
    this._save();
  }
}

export const campaignStore = new CampaignStore();
