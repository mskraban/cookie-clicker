<template>
  <div class="app" :class="{ 'no-particles': !store.settings.particles }">
    <div class="backdrop" aria-hidden="true">
      <span v-for="n in 14" :key="n" class="drift" :style="driftStyle(n)">🍪</span>
    </div>

    <main class="stage">
      <CookieClicker />
      <GoldenCookie />
    </main>

    <aside class="shop">
      <Shop />
    </aside>

    <Toasts />
  </div>
</template>

<script setup>
import { onMounted, watchEffect } from 'vue'
import { useCookieStore } from './store/cookieStore'
import { formatCookies } from './game/engine'
import CookieClicker from './components/CookieClicker.vue'
import GoldenCookie from './components/GoldenCookie.vue'
import Shop from './components/Shop.vue'
import Toasts from './components/Toasts.vue'

const store = useCookieStore()
onMounted(() => store.start())

// cookies in the browser tab title
watchEffect(() => {
  document.title = `${formatCookies(store.cookies)} cookies · Cookie Clicker`
})

// deterministic positions so the backdrop doesn't jump around
function driftStyle(n) {
  return {
    left: `${(n * 37) % 100}%`,
    animationDuration: `${18 + ((n * 7) % 14)}s`,
    animationDelay: `-${(n * 3) % 20}s`,
    fontSize: `${18 + ((n * 11) % 26)}px`,
  }
}
</script>
