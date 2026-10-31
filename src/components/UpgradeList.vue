<template>
  <div>
    <p v-if="!list.length && !owned.length" class="empty">
      Upgrades appear as you bake more cookies and build more buildings.
    </p>

    <ul class="grid" v-if="list.length">
      <li v-for="u in list" :key="u.id">
        <button
          type="button"
          class="tile"
          :class="{ affordable: u.cost <= store.cookies }"
          :disabled="u.cost > store.cookies"
          :aria-label="`${u.name}, ${shortNumber(u.cost)} cookies. ${u.desc}`"
          @click="store.buyUpgrade(u.id)"
        >
          <span class="tile--icon">{{ u.icon }}</span>
          <span class="tile--tip">
            <strong>{{ u.name }}</strong>
            <span>{{ u.desc }}</span>
            <em>🍪 {{ shortNumber(u.cost) }}</em>
          </span>
        </button>
      </li>
    </ul>

    <template v-if="owned.length">
      <h3 class="heading">Owned ({{ owned.length }})</h3>
      <ul class="grid owned">
        <li v-for="u in owned" :key="u.id">
          <span class="tile done" tabindex="0" :aria-label="`${u.name}. ${u.desc}`">
            <span class="tile--icon">{{ u.icon }}</span>
            <span class="tile--tip">
              <strong>{{ u.name }}</strong>
              <span>{{ u.desc }}</span>
            </span>
          </span>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCookieStore } from '../store/cookieStore'
import { UPGRADE_MAP, shortNumber } from '../game/engine'

const store = useCookieStore()
const list = computed(() => store.shownUpgrades)
const owned = computed(() => store.upgrades.map((id) => UPGRADE_MAP[id]).filter(Boolean))
</script>
