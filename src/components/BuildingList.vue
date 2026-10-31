<template>
  <div>
    <div class="buy-amount" role="group" aria-label="Buy amount">
      <span>Buy</span>
      <button
        v-for="a in amounts"
        :key="a"
        type="button"
        class="chip"
        :class="{ active: store.settings.buyAmount === a }"
        @click="store.setBuyAmount(a)"
      >{{ a === 'max' ? 'Max' : a }}</button>
    </div>

    <ul class="list">
      <li v-for="row in rows" :key="row.b.id" v-show="row.visible">
        <button
          type="button"
          class="item building"
          :class="{ locked: row.count === 0 && !row.afford, affordable: row.afford }"
          :disabled="!row.afford"
          @click="store.buyBuilding(row.b.id)"
        >
          <span class="item--icon">{{ row.b.icon }}</span>
          <span class="item--body">
            <span class="item--name">{{ row.mystery ? '???' : row.b.name }}</span>
            <span class="item--price" :class="{ short: !row.afford }">
              🍪 {{ shortNumber(row.cost) }}<template v-if="row.buyCount > 1"> <em>×{{ row.buyCount }}</em></template>
            </span>
            <span class="item--desc" v-if="!row.mystery">
              {{ row.b.flavor }}
              <template v-if="row.count">
                Each makes {{ shortNumber(row.each) }}/s<template v-if="row.total"> · all {{ shortNumber(row.total) }}/s ({{ row.share }}%)</template>.
              </template>
            </span>
          </span>
          <span class="item--count">{{ row.count || '' }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCookieStore } from '../store/cookieStore'
import { BUILDINGS, buildingCost, maxAffordable, shortNumber } from '../game/engine'

const store = useCookieStore()
const amounts = [1, 10, 100, 'max']

const rows = computed(() => {
  const amount = store.settings.buyAmount
  const stats = store.stats
  let seenLocked = false
  return BUILDINGS.map((b) => {
    const count = store.buildings[b.id] || 0
    const buyCount = amount === 'max' ? Math.max(1, maxAffordable(b, count, store.cookies)) : amount
    const cost = buildingCost(b, count, buyCount)
    const afford = store.cookies >= cost
    // show everything you own or can see coming: the next locked building shows as "???"
    const reachable = count > 0 || store.allTimeBaked >= b.cost * 0.5 || afford
    const visible = reachable || !seenLocked
    const mystery = !reachable
    if (!reachable) seenLocked = true
    const per = stats.perBuilding[b.id]
    return {
      b, count, buyCount, cost, afford, visible, mystery,
      each: per.each * stats.multiplier,
      total: per.total * stats.multiplier,
      share: stats.cps > 0 ? Math.round(((per.total * stats.multiplier) / stats.cps) * 100) : 0,
    }
  })
})
</script>
