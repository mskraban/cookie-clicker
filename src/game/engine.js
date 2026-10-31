// Pure game logic. No Vue, no DOM: every function takes a plain state object,
// so it can be unit-tested with `node --test` and reused by the Pinia store.

export const SAVE_VERSION = 2
export const COST_GROWTH = 1.15
export const OFFLINE_CAP_SECONDS = 8 * 3600
export const OFFLINE_EFFICIENCY = 0.5
export const GOLDEN_LIFETIME_MS = 13000
export const ACHIEVEMENT_BONUS = 0.01 // +1% CPS per achievement
export const CHIP_BONUS = 0.02 // +2% CPS per heavenly chip
export const CHIP_DIVISOR = 1e10 // 1 chip per 1e10 cookies baked (cube-root curve)

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

/* ------------------------------------------------------------------ buildings */

export const BUILDINGS = [
  { id: 'cursor', name: 'Cursor', plural: 'Cursors', icon: '👆', cost: 15, cps: 0.1, flavor: 'Autoclicks once every 10 seconds.' },
  { id: 'grandma', name: 'Grandma', plural: 'Grandmas', icon: '👵', cost: 100, cps: 1, flavor: 'A nice grandma to bake cookies.' },
  { id: 'farm', name: 'Farm', plural: 'Farms', icon: '🌾', cost: 1100, cps: 8, flavor: 'Grows cookie plants from cookie seeds.' },
  { id: 'mine', name: 'Mine', plural: 'Mines', icon: '⛏️', cost: 12000, cps: 47, flavor: 'Mines out cookie dough and chocolate chips.' },
  { id: 'factory', name: 'Factory', plural: 'Factories', icon: '🏭', cost: 130000, cps: 260, flavor: 'Produces large quantities of cookies.' },
  { id: 'bank', name: 'Bank', plural: 'Banks', icon: '🏦', cost: 1.4e6, cps: 1400, flavor: 'Generates cookies from interest.' },
  { id: 'temple', name: 'Temple', plural: 'Temples', icon: '🛕', cost: 20e6, cps: 7800, flavor: 'Full of precious, ancient chocolate.' },
  { id: 'wizard', name: 'Wizard tower', plural: 'Wizard towers', icon: '🧙', cost: 330e6, cps: 44000, flavor: 'Summons cookies with magic spells.' },
  { id: 'shipment', name: 'Shipment', plural: 'Shipments', icon: '🚀', cost: 5.1e9, cps: 260000, flavor: 'Brings in fresh cookies from the cookie planet.' },
  { id: 'lab', name: 'Alchemy lab', plural: 'Alchemy labs', icon: '⚗️', cost: 75e9, cps: 1.6e6, flavor: 'Turns gold into cookies.' },
  { id: 'portal', name: 'Portal', plural: 'Portals', icon: '🌀', cost: 1e12, cps: 10e6, flavor: 'Opens a door to the Cookieverse.' },
  { id: 'timemachine', name: 'Time machine', plural: 'Time machines', icon: '⏳', cost: 14e12, cps: 65e6, flavor: 'Brings cookies from the past, before they were even eaten.' },
]
export const BUILDING_MAP = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]))

/** Total price of buying `n` buildings when `owned` are already owned. */
export function buildingCost(b, owned, n = 1) {
  const first = b.cost * Math.pow(COST_GROWTH, owned)
  return Math.ceil((first * (Math.pow(COST_GROWTH, n) - 1)) / (COST_GROWTH - 1))
}

/** Largest n (0..max) such that buildingCost(b, owned, n) <= cookies. */
export function maxAffordable(b, owned, cookies, max = 1000) {
  if (!(cookies >= buildingCost(b, owned, 1))) return 0
  const first = b.cost * Math.pow(COST_GROWTH, owned)
  let n = Math.floor(Math.log((cookies * (COST_GROWTH - 1)) / first + 1) / Math.log(COST_GROWTH))
  n = Math.min(Math.max(n, 0), max)
  while (n > 0 && buildingCost(b, owned, n) > cookies) n--
  while (n < max && buildingCost(b, owned, n + 1) <= cookies) n++
  return n
}

/* ------------------------------------------------------------------- upgrades */

const CLICK_TIERS = [
  [100, 'Reinforced Index Finger'],
  [500, 'Carpal Tunnel Prevention'],
  [10e3, 'Ambidextrous'],
  [100e3, 'Steel Knuckles'],
  [10e6, 'Mechanical Fingers'],
  [100e6, 'Thunder Fists'],
  [1e9, 'Quantum Taps'],
  [10e9, 'Cosmic Poke'],
]
const BUILDING_TIERS = [
  { at: 1, price: 10, name: 'Sharpened' },
  { at: 5, price: 50, name: 'Reinforced' },
  { at: 25, price: 500, name: 'Overclocked' },
  { at: 50, price: 5000, name: 'Enchanted' },
  { at: 100, price: 50000, name: 'Transcendent' },
]
const GLOBAL_TIERS = [
  [50e3, 'Tasty Sprinkles', 1.1],
  [5e6, 'Chocolate Chips', 1.15],
  [500e6, 'Secret Family Recipe', 1.25],
  [50e9, 'Golden Ratio', 1.5],
]
const CLICK_CPS_TIERS = [
  [100e3, 'Thousand Fingers', 0.01],
  [10e6, 'Million Fingers', 0.02],
  [1e9, 'Billion Fingers', 0.05],
]

function buildUpgrades() {
  const list = []
  CLICK_TIERS.forEach(([cost, name], i) => {
    list.push({
      id: `click-${i + 1}`, name, icon: '👆', cost, group: 'Clicking',
      desc: 'Clicking is twice as powerful.',
      effect: { type: 'clickMult', value: 2 },
      show: (s) => s.runBaked >= cost * 0.25,
    })
  })
  CLICK_CPS_TIERS.forEach(([cost, name, value], i) => {
    list.push({
      id: `fingers-${i + 1}`, name, icon: '🖐️', cost, group: 'Clicking',
      desc: `Clicks gain +${Math.round(value * 100)}% of your cookies per second.`,
      effect: { type: 'clickCps', value },
      show: (s) => s.runBaked >= cost * 0.25,
    })
  })
  for (const b of BUILDINGS) {
    BUILDING_TIERS.forEach((t, i) => {
      list.push({
        id: `${b.id}-${i + 1}`, name: `${t.name} ${b.plural}`, icon: b.icon, cost: b.cost * t.price, group: b.plural,
        desc: `${b.plural} are twice as efficient.`,
        effect: { type: 'building', building: b.id, value: 2 },
        show: (s) => (s.buildings[b.id] || 0) >= t.at,
      })
    })
  }
  GLOBAL_TIERS.forEach(([cost, name, value], i) => {
    list.push({
      id: `global-${i + 1}`, name, icon: '✨', cost, group: 'Global',
      desc: `All cookie production +${Math.round((value - 1) * 100)}%.`,
      effect: { type: 'global', value },
      show: (s) => s.runBaked >= cost * 0.25,
    })
  })
  list.push(
    {
      id: 'clover', name: 'Lucky Clover', icon: '🍀', cost: 7777, group: 'Golden',
      desc: 'Golden cookies appear twice as often.',
      effect: { type: 'goldenInterval', value: 0.5 },
      show: (s) => s.runBaked >= 1000,
    },
    {
      id: 'golden-touch', name: 'Golden Touch', icon: '🌟', cost: 777777, group: 'Golden',
      desc: 'Golden cookie effects last 50% longer.',
      effect: { type: 'goldenDuration', value: 1.5 },
      show: (s) => s.runBaked >= 100000,
    },
  )
  return list.sort((a, b) => a.cost - b.cost)
}
export const UPGRADES = buildUpgrades()
export const UPGRADE_MAP = Object.fromEntries(UPGRADES.map((u) => [u.id, u]))

/* --------------------------------------------------------------- achievements */

function buildAchievements() {
  const list = []
  const add = (id, name, desc, icon, test) => list.push({ id, name, desc, icon, test })
  ;[
    [1, 'Wake and bake'], [1e3, 'Making some dough'], [1e6, 'So baked right now'], [1e9, 'Fledgling bakery'],
    [1e12, 'Affluent bakery'], [1e15, 'World-famous bakery'], [1e18, 'Cosmic bakery'],
  ].forEach(([n, name]) =>
    add(`baked-${n}`, name, `Bake ${shortNumber(n)} cookies in total.`, '🍪', (s) => s.allTimeBaked >= n))
  ;[
    [1, 'Click!'], [100, 'Clicktastic'], [1000, 'Clickathon'], [10000, 'Clickolympics'], [100000, 'Clickorama'],
  ].forEach(([n, name]) =>
    add(`clicks-${n}`, name, `Click the cookie ${n.toLocaleString('en-US')} ${n === 1 ? 'time' : 'times'}.`, '👆', (s) => s.clicks >= n))
  for (const b of BUILDINGS) {
    ;[[1, 'First '], [10, 'Ten '], [50, 'Fifty '], [100, 'Hundred ']].forEach(([n, prefix]) =>
      add(`own-${b.id}-${n}`, `${prefix}${n === 1 ? b.name : b.plural}`,
        `Own ${n} ${n === 1 ? b.name.toLowerCase() : b.plural.toLowerCase()}.`, b.icon,
        (s) => (s.buildings[b.id] || 0) >= n))
  }
  ;[
    [1, 'Casual baking'], [10, 'Hardcore baking'], [100, 'Steady tasty stream'], [1e3, 'Cookie monster'],
    [1e4, 'Mass producer'], [1e6, 'Cookie-dominating'], [1e8, 'Tastebud overload'],
  ].forEach(([n, name]) =>
    add(`cps-${n}`, name, `Bake ${shortNumber(n)} cookies per second.`, '⚡', (s, st) => st.cps >= n))
  ;[[1, 'Lucky!'], [7, 'Lucky streak'], [27, 'Golden gatherer'], [77, 'Midas touch']].forEach(([n, name]) =>
    add(`golden-${n}`, name, `Click ${n} golden ${n === 1 ? 'cookie' : 'cookies'}.`, '🌟', (s) => s.goldenClicked >= n))
  ;[[10, 'Upgrader'], [30, 'Collector'], [60, 'Hoarder']].forEach(([n, name]) =>
    add(`upgrades-${n}`, name, `Own ${n} upgrades at once.`, '🛠️', (s) => s.upgrades.length >= n))
  ;[[1, 'Ascendant'], [5, 'Reincarnation']].forEach(([n, name]) =>
    add(`ascend-${n}`, name, `Ascend ${n} ${n === 1 ? 'time' : 'times'}.`, '👼', (s) => s.ascensions >= n))
  return list
}
export const ACHIEVEMENTS = buildAchievements()
export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))

/* ------------------------------------------------------------- golden cookies */

export const GOLDEN_EFFECTS = [
  { type: 'frenzy', weight: 55, duration: 77000, label: 'Frenzy', icon: '🔥', desc: 'Production x7' },
  { type: 'lucky', weight: 30, duration: 0, label: 'Lucky', icon: '🍀', desc: 'Instant cookies' },
  { type: 'clickFrenzy', weight: 15, duration: 13000, label: 'Click frenzy', icon: '💥', desc: 'Clicks x777' },
]
export const EFFECT_INFO = Object.fromEntries(GOLDEN_EFFECTS.map((e) => [e.type, e]))

/* --------------------------------------------------------------------- state */

export function createState(now = Date.now()) {
  return {
    cookies: 0,
    runBaked: 0, // baked since the last ascension
    allTimeBaked: 0,
    clicks: 0,
    handmade: 0,
    buildings: {},
    upgrades: [],
    achievements: [],
    chips: 0,
    ascensions: 0,
    goldenClicked: 0,
    effects: [], // [{ type, until }]
    nextGolden: now + 60000,
    startedAt: now,
    lastSaved: now,
    settings: { buyAmount: 1, particles: true, floatingNumbers: true },
  }
}

/** Fields written to localStorage / exported. */
const SAVED_KEYS = [
  'cookies', 'runBaked', 'allTimeBaked', 'clicks', 'handmade', 'buildings', 'upgrades', 'achievements',
  'chips', 'ascensions', 'goldenClicked', 'effects', 'nextGolden', 'startedAt', 'lastSaved', 'settings',
]

export function serialize(s) {
  const out = { v: SAVE_VERSION }
  for (const k of SAVED_KEYS) out[k] = JSON.parse(JSON.stringify(s[k]))
  return out
}

const num = (v, d = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d)

/** Turn any parsed JSON into a valid state. Never throws; unknown data is dropped. */
export function sanitize(raw, now = Date.now()) {
  const s = createState(now)
  if (!raw || typeof raw !== 'object') return s
  for (const k of ['cookies', 'runBaked', 'allTimeBaked', 'clicks', 'handmade', 'chips', 'ascensions', 'goldenClicked']) {
    s[k] = num(raw[k], 0)
  }
  s.allTimeBaked = Math.max(s.allTimeBaked, s.runBaked)
  if (raw.buildings && typeof raw.buildings === 'object') {
    for (const b of BUILDINGS) {
      const n = Math.floor(num(raw.buildings[b.id], 0))
      if (n > 0) s.buildings[b.id] = n
    }
  }
  if (Array.isArray(raw.upgrades)) s.upgrades = [...new Set(raw.upgrades.filter((id) => UPGRADE_MAP[id]))]
  if (Array.isArray(raw.achievements)) s.achievements = [...new Set(raw.achievements.filter((id) => ACHIEVEMENT_MAP[id]))]
  if (Array.isArray(raw.effects)) {
    s.effects = raw.effects
      .filter((e) => e && EFFECT_INFO[e.type] && EFFECT_INFO[e.type].duration > 0 && num(e.until) > now)
      .map((e) => ({ type: e.type, until: e.until }))
  }
  s.nextGolden = num(raw.nextGolden, s.nextGolden)
  s.startedAt = num(raw.startedAt, now)
  s.lastSaved = Math.min(num(raw.lastSaved, now), now)
  if (raw.settings && typeof raw.settings === 'object') {
    if ([1, 10, 100, 'max'].includes(raw.settings.buyAmount)) s.settings.buyAmount = raw.settings.buyAmount
    if (typeof raw.settings.particles === 'boolean') s.settings.particles = raw.settings.particles
    if (typeof raw.settings.floatingNumbers === 'boolean') s.settings.floatingNumbers = raw.settings.floatingNumbers
  }
  return s
}

export function encodeSave(s) {
  const json = JSON.stringify(serialize(s))
  return btoa(unescape(encodeURIComponent(json)))
}

/** Returns a sanitized state, or null if the text is not a save. */
export function decodeSave(text, now = Date.now()) {
  try {
    const raw = JSON.parse(decodeURIComponent(escape(atob(String(text).trim()))))
    if (!raw || typeof raw !== 'object' || typeof raw.v !== 'number') return null
    return sanitize(raw, now)
  } catch {
    return null
  }
}

/* --------------------------------------------------------------------- stats */

export function activeEffects(s, now) {
  return s.effects.filter((e) => e.until > now)
}

/**
 * Everything derived from the state. Pass now = Infinity to ignore timed effects
 * (used for offline progress).
 */
export function computeStats(s, now = Date.now()) {
  let clickMult = 1
  let clickCps = 0
  let global = 1
  let goldenInterval = 1
  let goldenDuration = 1
  const buildingMult = {}
  for (const id of s.upgrades) {
    const u = UPGRADE_MAP[id]
    if (!u) continue
    const e = u.effect
    if (e.type === 'clickMult') clickMult *= e.value
    else if (e.type === 'clickCps') clickCps += e.value
    else if (e.type === 'global') global *= e.value
    else if (e.type === 'goldenInterval') goldenInterval *= e.value
    else if (e.type === 'goldenDuration') goldenDuration *= e.value
    else if (e.type === 'building') buildingMult[e.building] = (buildingMult[e.building] || 1) * e.value
  }
  const achievementMult = 1 + ACHIEVEMENT_BONUS * s.achievements.length
  const chipMult = 1 + CHIP_BONUS * s.chips
  const live = activeEffects(s, now)
  const frenzy = live.some((e) => e.type === 'frenzy') ? 7 : 1
  const clickFrenzy = live.some((e) => e.type === 'clickFrenzy') ? 777 : 1

  const perBuilding = {}
  let base = 0
  for (const b of BUILDINGS) {
    const n = s.buildings[b.id] || 0
    const each = b.cps * (buildingMult[b.id] || 1)
    perBuilding[b.id] = { each, total: each * n }
    base += each * n
  }
  const multiplier = global * achievementMult * chipMult * frenzy
  const cps = base * multiplier
  const clickPower = (clickMult + cps * clickCps) * clickFrenzy
  return {
    cps, clickPower, base, multiplier, global, achievementMult, chipMult, frenzy, clickFrenzy,
    clickMult, clickCps, goldenInterval, goldenDuration, perBuilding,
  }
}

export function chipsFromBaked(total) {
  return Math.floor(Math.cbrt(Math.max(0, total) / CHIP_DIVISOR))
}
export function pendingChips(s) {
  return Math.max(0, chipsFromBaked(s.allTimeBaked) - s.chips)
}

/** Cookies earned while the game was closed. */
export function offlineEarnings(s, now) {
  const elapsed = Math.max(0, (now - s.lastSaved) / 1000)
  const seconds = Math.min(elapsed, OFFLINE_CAP_SECONDS)
  const cps = computeStats(s, Infinity).cps
  return { seconds, elapsed, cookies: seconds * cps * OFFLINE_EFFICIENCY }
}

/* ------------------------------------------------------------------- actions */

export function earn(s, amount) {
  if (!(amount > 0)) return
  s.cookies += amount
  s.runBaked += amount
  s.allTimeBaked += amount
}

export function click(s, now = Date.now()) {
  const gain = computeStats(s, now).clickPower
  s.clicks += 1
  s.handmade += gain
  earn(s, gain)
  return gain
}

export function buyBuilding(s, id, n = 1) {
  const b = BUILDING_MAP[id]
  if (!b) return 0
  const owned = s.buildings[id] || 0
  const count = n === 'max' ? maxAffordable(b, owned, s.cookies) : n
  if (count < 1) return 0
  const cost = buildingCost(b, owned, count)
  if (cost > s.cookies) return 0
  s.cookies -= cost
  s.buildings[id] = owned + count
  return count
}

export function canBuyUpgrade(s, id) {
  const u = UPGRADE_MAP[id]
  return !!u && !s.upgrades.includes(id) && s.cookies >= u.cost
}

export function buyUpgrade(s, id) {
  if (!canBuyUpgrade(s, id)) return false
  s.cookies -= UPGRADE_MAP[id].cost
  s.upgrades.push(id)
  return true
}

/** Upgrades that are unlocked and not bought yet, cheapest first. */
export function availableUpgrades(s) {
  return UPGRADES.filter((u) => !s.upgrades.includes(u.id) && u.show(s))
}

export function checkAchievements(s, now = Date.now()) {
  const stats = computeStats(s, now)
  const unlocked = []
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements.includes(a.id) && a.test(s, stats)) {
      s.achievements.push(a.id)
      unlocked.push(a.id)
    }
  }
  return unlocked
}

export function scheduleGolden(s, now, rng = Math.random) {
  const interval = computeStats(s, now).goldenInterval
  s.nextGolden = now + (60 + rng() * 120) * 1000 * interval
}

/** Where a golden cookie should appear, as percentages of the play area. */
export function spawnGolden(now, rng = Math.random) {
  return { id: Math.floor(now), x: 8 + rng() * 84, y: 12 + rng() * 76, expires: now + GOLDEN_LIFETIME_MS }
}

export function pickGoldenEffect(rng = Math.random) {
  const total = GOLDEN_EFFECTS.reduce((t, e) => t + e.weight, 0)
  let roll = rng() * total
  for (const e of GOLDEN_EFFECTS) {
    roll -= e.weight
    if (roll < 0) return e
  }
  return GOLDEN_EFFECTS[0]
}

/** Apply a clicked golden cookie. Returns a description of what happened. */
export function claimGolden(s, now = Date.now(), rng = Math.random) {
  const effect = pickGoldenEffect(rng)
  const stats = computeStats(s, now)
  s.goldenClicked += 1
  let gained = 0
  if (effect.type === 'lucky') {
    gained = Math.min(s.cookies * 0.15, stats.cps * 900) + 13
    earn(s, gained)
  } else {
    const duration = effect.duration * stats.goldenDuration
    const live = s.effects.find((e) => e.type === effect.type && e.until > now)
    if (live) live.until = now + duration
    else s.effects.push({ type: effect.type, until: now + duration })
  }
  scheduleGolden(s, now, rng)
  return { effect, gained }
}

/**
 * Advance the game by dt seconds. Returns events for the UI:
 * { type: 'achievement', id } | { type: 'goldenSpawn', golden } | { type: 'goldenGone' }
 * `golden` is the currently visible golden cookie (or null) and is kept by the caller.
 */
export function tick(s, dt, now = Date.now(), golden = null, rng = Math.random) {
  const events = []
  let current = golden
  const stats = computeStats(s, now)
  earn(s, stats.cps * dt)
  s.effects = s.effects.filter((e) => e.until > now)

  if (current && now >= current.expires) {
    current = null
    scheduleGolden(s, now, rng)
    events.push({ type: 'goldenGone' })
  }
  if (!current && now >= s.nextGolden) {
    current = spawnGolden(now, rng)
    events.push({ type: 'goldenSpawn', golden: current })
  }
  for (const id of checkAchievements(s, now)) events.push({ type: 'achievement', id })
  return { events, golden: current }
}

/** Reset the run for heavenly chips. Returns the number of chips gained. */
export function ascend(s, now = Date.now()) {
  const gained = pendingChips(s)
  if (gained < 1) return 0
  s.chips += gained
  s.ascensions += 1
  s.cookies = 0
  s.runBaked = 0
  s.buildings = {}
  s.upgrades = []
  s.effects = []
  s.clicks = 0
  s.handmade = 0
  scheduleGolden(s, now)
  return gained
}

/* ------------------------------------------------------------------ helpers */

/** 1234 -> "1.23K". Values under 1000 keep one decimal when fractional. */
export function shortNumber(n) {
  if (!Number.isFinite(n)) return '∞'
  if (n < 0) return '-' + shortNumber(-n)
  if (n < 1000) return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10)
  const tier = Math.floor(Math.log10(n) / 3)
  if (tier >= SUFFIXES.length) return n.toExponential(2).replace('e+', 'e')
  const v = n / Math.pow(1000, tier)
  const text = v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0)
  return text + SUFFIXES[tier]
}

/** Cookie counter: whole cookies, grouped with commas up to a million. */
export function formatCookies(n) {
  if (n < 1e6) return Math.floor(n).toLocaleString('en-US')
  return shortNumber(n)
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m ${sec}s`
  return `${sec}s`
}
