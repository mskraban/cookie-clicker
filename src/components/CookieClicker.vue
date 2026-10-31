<template>
  <section class="cookie" aria-label="Cookie">
    <div class="score">
      <div class="score--value" aria-live="off">{{ formatCookies(store.cookies) }}</div>
      <div class="score--title">{{ store.cookies >= 2 || store.cookies < 1 ? 'cookies' : 'cookie' }}</div>
      <div class="score--cps">per second: {{ shortNumber(store.stats.cps) }}</div>
    </div>

    <div class="cookie--wrap">
      <button
        class="cookie--button"
        :class="{ pop }"
        type="button"
        aria-label="Bake a cookie"
        @pointerdown.prevent="onPointer"
        @keydown.enter.space.prevent="onKey"
      >
        <img :src="cookieImg" class="cookie--img" alt="" draggable="false" />
      </button>
      <span
        v-for="f in floaters"
        :key="f.id"
        class="floater"
        :style="{ left: f.x + 'px', top: f.y + 'px' }"
      >+{{ shortNumber(f.gain) }}</span>
    </div>

    <ul v-if="store.liveEffects.length" class="effects" aria-label="Active effects">
      <li v-for="e in store.liveEffects" :key="e.type" class="effect" :class="e.type">
        <span class="effect--icon">{{ e.info.icon }}</span>
        <span class="effect--name">{{ e.info.label }}: {{ e.info.desc }}</span>
        <span class="effect--time">{{ Math.ceil(e.left) }}s</span>
      </li>
    </ul>

    <div v-if="store.clicks === 0 && store.allTimeBaked < 1" class="click-power hint">
      Click the cookie to start baking! 👆
    </div>
    <div v-else class="click-power">Each click: +{{ shortNumber(store.stats.clickPower) }}</div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useCookieStore } from '../store/cookieStore'
import { formatCookies, shortNumber } from '../game/engine'
import cookieImg from '../assets/cookie.webp'

const store = useCookieStore()
const pop = ref(false)
const floaters = ref([])
let floaterId = 0
let popTimer = null

function bake(x, y) {
  const gain = store.click()
  pop.value = true
  clearTimeout(popTimer)
  popTimer = setTimeout(() => (pop.value = false), 90)
  if (store.settings.floatingNumbers) {
    const id = ++floaterId
    floaters.value.push({ id, gain, x, y })
    if (floaters.value.length > 24) floaters.value.shift()
    setTimeout(() => (floaters.value = floaters.value.filter((f) => f.id !== id)), 900)
  }
}

function onPointer(e) {
  const box = e.currentTarget.parentElement.getBoundingClientRect()
  bake(e.clientX - box.left, e.clientY - box.top)
}

function onKey(e) {
  const box = e.currentTarget.parentElement.getBoundingClientRect()
  bake(box.width / 2 + (Math.random() - 0.5) * 80, box.height / 2 + (Math.random() - 0.5) * 80)
}
</script>
