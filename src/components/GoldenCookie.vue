<template>
  <button
    v-if="store.golden"
    :key="store.golden.id"
    class="golden"
    type="button"
    aria-label="Golden cookie! Click it quickly"
    :style="{ left: store.golden.x + '%', top: store.golden.y + '%' }"
    @pointerdown.prevent="store.claimGolden()"
    @keydown.enter.space.prevent="store.claimGolden()"
  >
    <img :src="cookieImg" alt="" draggable="false" />
  </button>
</template>

<script setup>
import { useCookieStore } from '../store/cookieStore'
import cookieImg from '../assets/cookie.webp'

const store = useCookieStore()
</script>
