<template>
  <div>
    <section class="card prestige">
      <h3 class="heading">👼 Ascension</h3>
      <p>
        Heavenly chips: <strong>{{ store.chips }}</strong>
        <span class="muted">(+{{ store.chips * 2 }}% production)</span>
      </p>
      <p v-if="store.pendingChips > 0">
        Ascending now gives you <strong>{{ store.pendingChips }}</strong>
        heavenly {{ store.pendingChips === 1 ? 'chip' : 'chips' }}.
        Your cookies, buildings and upgrades reset; achievements and chips stay.
      </p>
      <p v-else class="muted">
        Bake {{ shortNumber(store.nextChipAt) }} cookies in total to earn your next chip
        ({{ shortNumber(Math.max(0, store.nextChipAt - store.allTimeBaked)) }} to go).
      </p>
      <button
        v-if="!confirming"
        type="button"
        class="btn primary"
        :disabled="store.pendingChips < 1"
        @click="confirming = true"
      >Ascend</button>
      <div v-else class="confirm">
        <span>Reset this run for {{ store.pendingChips }} chip(s)?</span>
        <button type="button" class="btn primary" @click="ascend">Yes, ascend</button>
        <button type="button" class="btn" @click="confirming = false">Cancel</button>
      </div>
    </section>

    <section class="card">
      <h3 class="heading">Statistics</h3>
      <dl class="stats">
        <div v-for="r in rows" :key="r[0]"><dt>{{ r[0] }}</dt><dd>{{ r[1] }}</dd></div>
      </dl>
    </section>

    <section class="card" v-if="breakdown.length">
      <h3 class="heading">Production bonuses</h3>
      <dl class="stats">
        <div v-for="r in breakdown" :key="r[0]"><dt>{{ r[0] }}</dt><dd>{{ r[1] }}</dd></div>
      </dl>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCookieStore } from '../store/cookieStore'
import { BUILDINGS, formatCookies, formatDuration, shortNumber } from '../game/engine'

const store = useCookieStore()
const confirming = ref(false)

function ascend() {
  store.ascend()
  confirming.value = false
}

const rows = computed(() => {
  const owned = BUILDINGS.reduce((t, b) => t + (store.buildings[b.id] || 0), 0)
  return [
    ['Cookies in bank', formatCookies(store.cookies)],
    ['Baked this run', formatCookies(store.runBaked)],
    ['Baked all time', formatCookies(store.allTimeBaked)],
    ['Per second', shortNumber(store.stats.cps)],
    ['Per click', shortNumber(store.stats.clickPower)],
    ['Clicks', store.clicks.toLocaleString('en-US')],
    ['Cookies from clicking', formatCookies(store.handmade)],
    ['Buildings owned', owned.toLocaleString('en-US')],
    ['Golden cookies clicked', store.goldenClicked.toLocaleString('en-US')],
    ['Ascensions', store.ascensions.toLocaleString('en-US')],
    ['Playing since', formatDuration((store.now - store.startedAt) / 1000) + ' ago'],
  ]
})

const breakdown = computed(() => {
  const s = store.stats
  const out = []
  const pct = (m) => `+${Math.round((m - 1) * 100)}%`
  if (s.global > 1) out.push(['Upgrades', pct(s.global)])
  if (store.achievements.length) out.push(['Achievements', pct(s.achievementMult)])
  if (store.chips) out.push(['Heavenly chips', pct(s.chipMult)])
  if (s.frenzy > 1) out.push(['Frenzy', `x${s.frenzy}`])
  return out
})
</script>
