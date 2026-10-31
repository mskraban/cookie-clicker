import { defineStore } from 'pinia'
import * as E from '../game/engine.js'

const SAVE_KEY = 'cookie-clicker:save:v2'
const LEGACY_KEY = 'cookie' // the old Pinia persisted store: { score, clickMultiplier, autoClick }
const TICK_MS = 100
const AUTOSAVE_MS = 5000

let timer = null
let lastTick = 0
let lastSave = 0
let toastId = 0

function readSave() {
  try {
    const text = localStorage.getItem(SAVE_KEY)
    if (text) return E.sanitize(JSON.parse(text))
  } catch {
    /* corrupted save: fall through to a fresh game */
  }
  // carry the old version's score over so nobody loses their cookies
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null')
    if (legacy && Number.isFinite(legacy.score) && legacy.score > 0) {
      const s = E.createState()
      s.cookies = legacy.score
      s.runBaked = legacy.score
      s.allTimeBaked = legacy.score
      return s
    }
  } catch {
    /* ignore */
  }
  return E.createState()
}

export const useCookieStore = defineStore('cookie', {
  state: () => ({
    ...E.createState(),
    now: Date.now(), // reactive clock, drives timers in the UI (not saved)
    golden: null, // visible golden cookie (not saved)
    toasts: [],
    lastClick: null, // last click gain, for floating numbers
    started: false,
  }),

  getters: {
    stats: (s) => E.computeStats(s, s.now),
    liveEffects: (s) =>
      E.activeEffects(s, s.now).map((e) => ({
        ...e,
        info: E.EFFECT_INFO[e.type],
        left: Math.max(0, (e.until - s.now) / 1000),
      })),
    pendingChips: (s) => E.pendingChips(s),
    shownUpgrades: (s) => E.availableUpgrades(s),
    affordableUpgrades() {
      return this.shownUpgrades.filter((u) => u.cost <= this.cookies).length
    },
    nextChipAt: (s) => Math.pow(E.chipsFromBaked(s.allTimeBaked) + 1, 3) * E.CHIP_DIVISOR,
  },

  actions: {
    /** Load the save, grant offline cookies and start the game loop. Safe to call twice. */
    start() {
      if (this.started) return
      this.started = true
      const saved = readSave()
      this.$patch(saved)
      const now = Date.now()
      this.now = now
      const off = E.offlineEarnings(this, now)
      if (off.elapsed > 60 && off.cookies >= 1) {
        E.earn(this, off.cookies)
        this.toast(`Welcome back! Your bakers made ${E.formatCookies(off.cookies)} cookies in ${E.formatDuration(off.seconds)}.`, '🏠', 'info')
      }
      this.lastSaved = now
      E.checkAchievements(this, now)
      lastTick = now
      lastSave = now
      timer = setInterval(() => this.loop(), TICK_MS)
      window.addEventListener('beforeunload', () => this.save())
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.save()
      })
    },

    loop() {
      const now = Date.now()
      const dt = (now - lastTick) / 1000
      lastTick = now
      this.now = now
      if (dt > 120) {
        // the computer slept: pay it out like offline time (capped, half rate).
        // Background tabs are throttled to ~1 tick a minute, which stays under this limit
        // and is paid in full below.
        const off = E.offlineEarnings({ ...this.$state, lastSaved: now - dt * 1000 }, now)
        E.earn(this, off.cookies)
        this.toast(`While you were away you baked ${E.formatCookies(off.cookies)} cookies.`, '😴', 'info')
        return
      }
      const res = E.tick(this, dt, now, this.golden)
      this.golden = res.golden
      for (const ev of res.events) {
        if (ev.type === 'achievement') {
          const a = E.ACHIEVEMENT_MAP[ev.id]
          this.toast(`${a.name}: ${a.desc}`, a.icon, 'achievement')
        }
      }
      if (now - lastSave >= AUTOSAVE_MS) this.save()
    },

    click() {
      const gain = E.click(this, Date.now())
      this.lastClick = { gain, at: Date.now() }
      return gain
    },

    buyBuilding(id) {
      const amount = this.settings.buyAmount
      return E.buyBuilding(this, id, amount)
    },

    buyUpgrade(id) {
      const ok = E.buyUpgrade(this, id)
      if (ok) this.save()
      return ok
    },

    claimGolden() {
      if (!this.golden) return
      const now = Date.now()
      const { effect, gained } = E.claimGolden(this, now)
      this.golden = null
      const text =
        effect.type === 'lucky'
          ? `Lucky! +${E.formatCookies(gained)} cookies.`
          : `${effect.label}! ${effect.desc} for ${Math.round((this.liveEffects.find((e) => e.type === effect.type)?.left ?? 0))}s.`
      this.toast(text, effect.icon, 'golden')
      return effect
    },

    ascend() {
      const gained = E.ascend(this, Date.now())
      if (gained) {
        this.golden = null
        this.toast(`You ascended and gained ${gained} heavenly ${gained === 1 ? 'chip' : 'chips'}.`, '👼', 'achievement')
        this.save()
      }
      return gained
    },

    setBuyAmount(v) {
      this.settings.buyAmount = v
    },

    toast(text, icon = '🍪', kind = 'info') {
      const id = ++toastId
      this.toasts.push({ id, text, icon, kind })
      if (this.toasts.length > 4) this.toasts.shift()
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id)
      }, 5000)
    },

    save() {
      lastSave = Date.now()
      this.lastSaved = lastSave
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(E.serialize(this)))
      } catch {
        /* storage full or blocked (private mode): the game still runs */
      }
    },

    exportSave() {
      return E.encodeSave(this)
    },

    importSave(text) {
      const next = E.decodeSave(text)
      if (!next) return false
      this.$patch(next)
      this.golden = null
      this.save()
      return true
    },

    hardReset() {
      const fresh = E.createState()
      this.$patch(fresh)
      // $patch merges objects, so clear the collections explicitly
      this.buildings = {}
      this.upgrades = []
      this.achievements = []
      this.effects = []
      this.golden = null
      this.save()
    },
  },
})

export function stopGame() {
  clearInterval(timer)
}
