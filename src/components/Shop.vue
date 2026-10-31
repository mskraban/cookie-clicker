<template>
  <div class="shop--inner">
    <nav class="tabs" role="tablist" aria-label="Shop sections">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="tab"
        :class="{ active: tab === t.id }"
        role="tab"
        type="button"
        :aria-selected="tab === t.id"
        :aria-label="t.title || t.label"
        :title="t.title || t.label"
        @click="tab = t.id"
      >
        <span class="tab--icon">{{ t.icon }}</span>
        <span v-if="t.label" class="tab--label">{{ t.label }}</span>
        <span v-if="t.badge" class="tab--badge">{{ t.badge }}</span>
      </button>
    </nav>

    <div class="panel" role="tabpanel">
      <BuildingList v-if="tab === 'buildings'" />
      <UpgradeList v-else-if="tab === 'upgrades'" />
      <AchievementList v-else-if="tab === 'achievements'" />
      <StatsPanel v-else-if="tab === 'stats'" />
      <SettingsPanel v-else />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCookieStore } from '../store/cookieStore'
import { ACHIEVEMENTS } from '../game/engine'
import BuildingList from './BuildingList.vue'
import UpgradeList from './UpgradeList.vue'
import AchievementList from './AchievementList.vue'
import StatsPanel from './StatsPanel.vue'
import SettingsPanel from './SettingsPanel.vue'

const store = useCookieStore()
const tab = ref('buildings')

const tabs = computed(() => [
  { id: 'buildings', icon: '🏭', label: 'Buildings', badge: 0 },
  { id: 'upgrades', icon: '⚙️', label: 'Upgrades', badge: store.affordableUpgrades },
  { id: 'achievements', icon: '🏆', label: `${store.achievements.length}/${ACHIEVEMENTS.length}`, badge: 0 },
  { id: 'stats', icon: '📊', label: 'Stats', badge: store.pendingChips > 0 ? '!' : 0 },
  { id: 'settings', icon: '🔧', label: '', title: 'Options', badge: 0 },
])
</script>
