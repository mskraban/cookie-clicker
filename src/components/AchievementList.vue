<template>
  <div>
    <p class="note">
      Each achievement permanently adds <strong>+1% cookie production</strong>.
      Current bonus: <strong>+{{ store.achievements.length }}%</strong>.
    </p>
    <ul class="grid">
      <li v-for="a in ACHIEVEMENTS" :key="a.id">
        <span
          class="tile"
          :class="{ done: has(a.id), locked: !has(a.id) }"
          tabindex="0"
          :aria-label="has(a.id) ? `${a.name}: ${a.desc}` : `Locked: ${a.desc}`"
        >
          <span class="tile--icon">{{ has(a.id) ? a.icon : '🔒' }}</span>
          <span class="tile--tip">
            <strong>{{ has(a.id) ? a.name : '???' }}</strong>
            <span>{{ a.desc }}</span>
          </span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useCookieStore } from '../store/cookieStore'
import { ACHIEVEMENTS } from '../game/engine'

const store = useCookieStore()
const has = (id) => store.achievements.includes(id)
</script>
