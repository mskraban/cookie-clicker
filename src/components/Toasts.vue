<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.kind">
        <span class="toast--icon">{{ t.icon }}</span>
        <span class="toast--text">{{ t.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useCookieStore } from '../store/cookieStore'

const store = useCookieStore()
</script>
