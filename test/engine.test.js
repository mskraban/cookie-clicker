import test from 'node:test'
import assert from 'node:assert/strict'
import * as E from '../src/game/engine.js'

const NOW = 1_700_000_000_000
const fresh = () => E.createState(NOW)

test('building cost grows 15% per owned and bulk price equals sum of singles', () => {
  const b = E.BUILDING_MAP.cursor
  assert.equal(E.buildingCost(b, 0), 15)
  assert.equal(E.buildingCost(b, 1), Math.ceil(15 * 1.15))
  let sum = 0
  for (let i = 0; i < 10; i++) sum += 15 * Math.pow(1.15, i)
  assert.ok(Math.abs(E.buildingCost(b, 0, 10) - sum) <= 1)
})

test('maxAffordable is exact at the boundary', () => {
  const b = E.BUILDING_MAP.grandma
  for (const owned of [0, 3, 20, 80]) {
    for (const cookies of [0, 99, 100, 5000, 123456, 9e9]) {
      const n = E.maxAffordable(b, owned, cookies)
      assert.ok(n === 0 || E.buildingCost(b, owned, n) <= cookies)
      assert.ok(E.buildingCost(b, owned, n + 1) > cookies)
    }
  }
})

test('clicking gives 1 cookie and counts', () => {
  const s = fresh()
  assert.equal(E.click(s, NOW), 1)
  assert.equal(s.cookies, 1)
  assert.equal(s.clicks, 1)
  assert.equal(s.runBaked, 1)
})

test('can buy with exactly enough cookies (old bug: <= disabled the button)', () => {
  const s = fresh()
  s.cookies = 15
  assert.equal(E.buyBuilding(s, 'cursor'), 1)
  assert.equal(s.cookies, 0)
  assert.equal(s.buildings.cursor, 1)
  s.cookies = 99
  assert.equal(E.buyBuilding(s, 'grandma'), 0)
})

test('buy max and bulk amounts', () => {
  const s = fresh()
  s.cookies = 1000
  const n = E.buyBuilding(s, 'cursor', 'max')
  assert.ok(n > 10)
  assert.ok(s.cookies >= 0)
  assert.equal(s.buildings.cursor, n)
  s.cookies = 5
  assert.equal(E.buyBuilding(s, 'cursor', 10), 0)
})

test('cps from buildings, upgrades, achievements and chips multiply', () => {
  const s = fresh()
  s.buildings = { cursor: 10, grandma: 2 }
  assert.ok(Math.abs(E.computeStats(s, NOW).cps - 3) < 1e-9)
  s.upgrades.push('grandma-1') // grandmas x2
  assert.ok(Math.abs(E.computeStats(s, NOW).cps - 5) < 1e-9)
  s.upgrades.push('global-1') // +10%
  assert.ok(Math.abs(E.computeStats(s, NOW).cps - 5.5) < 1e-9)
  s.chips = 10 // +20%
  assert.ok(Math.abs(E.computeStats(s, NOW).cps - 5 * 1.1 * 1.2) < 1e-9)
  s.achievements = ['a', 'b'].map(() => E.ACHIEVEMENTS[0].id).slice(0, 1)
  assert.ok(Math.abs(E.computeStats(s, NOW).cps - 5 * 1.1 * 1.2 * 1.01) < 1e-9)
})

test('click upgrades and thousand fingers', () => {
  const s = fresh()
  s.upgrades.push('click-1', 'click-2')
  assert.equal(E.computeStats(s, NOW).clickPower, 4)
  s.buildings = { grandma: 100 }
  s.upgrades.push('fingers-1')
  const st = E.computeStats(s, NOW)
  assert.ok(Math.abs(st.clickPower - (4 + st.cps * 0.01)) < 1e-9)
})

test('upgrade visibility and purchase', () => {
  const s = fresh()
  assert.ok(!E.availableUpgrades(s).some((u) => u.id === 'click-1'))
  s.runBaked = 30
  assert.ok(E.availableUpgrades(s).some((u) => u.id === 'click-1'))
  s.cookies = 99
  assert.equal(E.buyUpgrade(s, 'click-1'), false)
  s.cookies = 100
  assert.equal(E.buyUpgrade(s, 'click-1'), true)
  assert.equal(E.buyUpgrade(s, 'click-1'), false) // only once
  assert.ok(!E.availableUpgrades(s).some((u) => u.id === 'click-1'))
  assert.equal(s.cookies, 0)
})

test('building tier upgrades unlock at the owned thresholds', () => {
  const s = fresh()
  assert.ok(!E.UPGRADE_MAP['farm-1'].show(s))
  s.buildings.farm = 1
  assert.ok(E.UPGRADE_MAP['farm-1'].show(s))
  assert.ok(!E.UPGRADE_MAP['farm-2'].show(s))
  s.buildings.farm = 5
  assert.ok(E.UPGRADE_MAP['farm-2'].show(s))
})

test('every id is unique and every building has five tiers', () => {
  assert.equal(new Set(E.UPGRADES.map((u) => u.id)).size, E.UPGRADES.length)
  assert.equal(new Set(E.ACHIEVEMENTS.map((a) => a.id)).size, E.ACHIEVEMENTS.length)
  for (const b of E.BUILDINGS) {
    for (let i = 1; i <= 5; i++) assert.ok(E.UPGRADE_MAP[`${b.id}-${i}`], `${b.id}-${i}`)
  }
  assert.ok(E.UPGRADES.length > 60)
  assert.ok(E.ACHIEVEMENTS.length > 60)
})

test('tick produces cookies and unlocks achievements once', () => {
  const s = fresh()
  s.buildings = { grandma: 10 }
  const { events } = E.tick(s, 2, NOW + 2000, null)
  assert.ok(Math.abs(s.cookies - 20) < 1e-9)
  const ach = events.filter((e) => e.type === 'achievement').map((e) => e.id)
  assert.ok(ach.includes('baked-1'))
  assert.ok(ach.includes('own-grandma-1'))
  assert.ok(ach.includes('own-grandma-10'))
  const again = E.tick(s, 1, NOW + 3000, null).events.filter((e) => e.type === 'achievement')
  assert.equal(again.length, 0)
})

test('golden cookie: spawns when due, expires, reschedules', () => {
  const s = fresh()
  const rng = () => 0.5
  let r = E.tick(s, 0.1, NOW + 1000, null, rng)
  assert.equal(r.golden, null)
  r = E.tick(s, 0.1, s.nextGolden + 1, null, rng)
  assert.ok(r.golden)
  assert.ok(r.events.some((e) => e.type === 'goldenSpawn'))
  const when = r.golden.expires + 1
  r = E.tick(s, 0.1, when, r.golden, rng)
  assert.equal(r.golden, null)
  assert.ok(s.nextGolden > when)
})

test('golden effects: frenzy x7, click frenzy x777, lucky bank cap', () => {
  const s = fresh()
  s.buildings = { grandma: 10 }
  s.cookies = 1e6
  // rng 0 -> frenzy (first effect)
  let res = E.claimGolden(s, NOW, () => 0)
  assert.equal(res.effect.type, 'frenzy')
  assert.ok(Math.abs(E.computeStats(s, NOW + 1).cps - 70) < 1e-9)
  assert.ok(Math.abs(E.computeStats(s, NOW + 78000).cps - 10) < 1e-9) // expired
  // rng 0.99 -> click frenzy
  res = E.claimGolden(s, NOW, () => 0.99)
  assert.equal(res.effect.type, 'clickFrenzy')
  assert.equal(E.computeStats(s, NOW + 1).clickPower, 777)
  // lucky: roll 0.7 of 100 = 70 -> after frenzy 55 weight => lucky
  const t = fresh()
  t.buildings = { grandma: 10 }
  t.cookies = 1000
  const before = t.cookies
  res = E.claimGolden(t, NOW, () => 0.7)
  assert.equal(res.effect.type, 'lucky')
  assert.ok(Math.abs(res.gained - (Math.min(before * 0.15, 10 * 900) + 13)) < 1e-9)
  assert.equal(t.goldenClicked, 1)
})

test('golden touch lengthens effects and clover shortens the wait', () => {
  const s = fresh()
  s.upgrades.push('golden-touch')
  E.claimGolden(s, NOW, () => 0)
  assert.equal(s.effects[0].until, NOW + 77000 * 1.5)
  const t = fresh()
  t.upgrades.push('clover')
  E.scheduleGolden(t, NOW, () => 0)
  assert.equal(t.nextGolden, NOW + 30000)
})

test('prestige: chips curve, ascend resets the run but keeps meta progress', () => {
  assert.equal(E.chipsFromBaked(0), 0)
  assert.equal(E.chipsFromBaked(9.9e9), 0)
  assert.equal(E.chipsFromBaked(1e10), 1)
  assert.equal(E.chipsFromBaked(8e10), 2)
  assert.equal(E.chipsFromBaked(1e13), 10)
  const s = fresh()
  s.allTimeBaked = 8e10
  s.runBaked = 8e10
  s.cookies = 123
  s.buildings = { cursor: 5 }
  s.upgrades = ['click-1']
  s.achievements = ['baked-1']
  assert.equal(E.pendingChips(s), 2)
  assert.equal(E.ascend(s, NOW), 2)
  assert.equal(s.chips, 2)
  assert.equal(s.cookies, 0)
  assert.deepEqual(s.buildings, {})
  assert.deepEqual(s.upgrades, [])
  assert.deepEqual(s.achievements, ['baked-1'])
  assert.equal(s.allTimeBaked, 8e10)
  assert.equal(E.pendingChips(s), 0)
  assert.equal(E.ascend(s, NOW), 0) // nothing to gain
  assert.ok(Math.abs(E.computeStats({ ...s, buildings: { grandma: 1 } }, NOW).cps - 1 * 1.04 * 1.01) < 1e-9)
})

test('offline earnings ignore frenzy, cap at 8h and run at 50%', () => {
  const s = fresh()
  s.buildings = { grandma: 10 }
  s.effects = [{ type: 'frenzy', until: NOW + 1e9 }]
  s.lastSaved = NOW - 3600 * 1000
  const r = E.offlineEarnings(s, NOW)
  assert.equal(r.seconds, 3600)
  assert.ok(Math.abs(r.cookies - 3600 * 10 * 0.5) < 1e-6)
  s.lastSaved = NOW - 100 * 3600 * 1000
  assert.equal(E.offlineEarnings(s, NOW).seconds, 8 * 3600)
})

test('save round trip, export/import and hostile input', () => {
  const s = fresh()
  s.cookies = 5000.5
  s.buildings = { cursor: 3, grandma: 2 }
  s.upgrades = ['click-1']
  s.achievements = ['baked-1']
  s.chips = 3
  s.settings.buyAmount = 'max'
  const back = E.decodeSave(E.encodeSave(s), NOW)
  assert.equal(back.cookies, 5000.5)
  assert.deepEqual(back.buildings, { cursor: 3, grandma: 2 })
  assert.deepEqual(back.upgrades, ['click-1'])
  assert.equal(back.settings.buyAmount, 'max')
  assert.equal(E.decodeSave('not a save'), null)
  assert.equal(E.decodeSave(btoa('{"foo":1}')), null)

  const dirty = E.sanitize({
    cookies: -5, runBaked: 'x', clicks: NaN, chips: Infinity,
    buildings: { cursor: 2.7, ghost: 99, grandma: -1 },
    upgrades: ['click-1', 'click-1', 'nope'],
    achievements: ['nope'],
    effects: [{ type: 'frenzy', until: NOW + 5000 }, { type: 'lucky', until: NOW + 5000 }, { type: 'frenzy', until: NOW - 1 }],
    settings: { buyAmount: 7, particles: 'yes' },
    lastSaved: NOW + 99999,
  }, NOW)
  assert.equal(dirty.cookies, 0)
  assert.equal(dirty.chips, 0)
  assert.deepEqual(dirty.buildings, { cursor: 2 })
  assert.deepEqual(dirty.upgrades, ['click-1'])
  assert.deepEqual(dirty.achievements, [])
  assert.equal(dirty.effects.length, 1)
  assert.equal(dirty.settings.buyAmount, 1)
  assert.equal(dirty.settings.particles, true)
  assert.equal(dirty.lastSaved, NOW)
  assert.deepEqual(E.sanitize(null, NOW), E.createState(NOW))
})

test('number formatting', () => {
  assert.equal(E.shortNumber(0), '0')
  assert.equal(E.shortNumber(0.1), '0.1')
  assert.equal(E.shortNumber(999), '999')
  assert.equal(E.shortNumber(1234), '1.23K')
  assert.equal(E.shortNumber(12345), '12.3K')
  assert.equal(E.shortNumber(123456), '123K')
  assert.equal(E.shortNumber(1.5e6), '1.50M')
  assert.equal(E.shortNumber(2e9), '2.00B')
  assert.equal(E.shortNumber(3.2e15), '3.20Qa')
  assert.equal(E.shortNumber(1e40), '1.00e40')
  assert.equal(E.formatCookies(12345.9), '12,345')
  assert.equal(E.formatCookies(2.5e6), '2.50M')
  assert.equal(E.formatDuration(3725), '1h 2m')
  assert.equal(E.formatDuration(59), '59s')
  assert.equal(E.formatDuration(90061), '1d 1h')
})

test('a scripted playthrough reaches the first ascension', () => {
  const s = fresh()
  let now = NOW
  let golden = null
  // buy the best-value thing every simulated second
  for (let sec = 0; sec < 60 * 60 * 12 && E.pendingChips(s) < 1; sec++) {
    now += 1000
    for (let c = 0; c < 5; c++) E.click(s, now)
    const r = E.tick(s, 1, now, golden)
    golden = r.golden
    if (golden) E.claimGolden(s, now), (golden = null)
    for (const u of E.availableUpgrades(s)) E.buyUpgrade(s, u.id)
    for (const b of [...E.BUILDINGS].reverse()) {
      while (E.buyBuilding(s, b.id, 1)) {
        /* keep buying the most expensive thing we can afford */
      }
    }
  }
  assert.ok(E.pendingChips(s) >= 1, 'should earn a heavenly chip within 12 simulated hours')
})
