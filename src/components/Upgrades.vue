<template>
  <div class="upgrades">
    <button
        @click="increaseClickLevel"
        class="upgrade"
        :disabled="this.store.score <= this.clickMultiplier.nextLevelPrice"
    >
      <img
          :src="cursorIcon"
          class="icon"
          alt="Cursor icon"
      />
      <span class="title">{{ clickMultiplier.level + 1 }}x Click</span>
      <span class="price">{{ clickMultiplier.nextLevelPrice }}</span>
    </button>
    <button
        @click="increaseAutoClick"
        class="upgrade"
        :disabled="this.store.score <= this.autoClick.nextLevelPrice"
    >
      <img
          :src="cursorIcon"
          class="icon"
          alt="Cursor icon"
      />
      <span class="title">{{ autoClick.level + 1 }}x Autoclick</span>
      <span class="price">{{ autoClick.nextLevelPrice }}</span>
    </button>
  </div>
</template>

<script>
import {useCookieStore} from "./../store/cookieStore";
import cursorIcon from "./../assets/cursor-click.svg"
export default {
  name: 'Upgrades',
  data() {
    return {
      cursorIcon: cursorIcon,
      score: this.store.score,
      clickMultiplier: {
        level: this.store.clickMultiplier.level,
        nextLevelPrice: this.store.clickMultiplier.nextLevelPrice
      },
      autoClick: {
        level: this.store.autoClick.level,
        nextLevelPrice: this.store.autoClick.nextLevelPrice,
      }
    };
  },
  setup() {
    const store = useCookieStore();
    return {
      store,
    }
  },
  mounted() {
    this.clickMultiplier = this.store.getClickMultiplier();
    this.autoClick = this.store.getAutoClick();

    this.autoClicker();
  },
  methods: {
    increaseClickLevel() {
      if (this.store.score >= this.clickMultiplier.nextLevelPrice) {
        this.clickMultiplier.level++;
        this.store.setClickMultiplier(this.clickMultiplier);
        this.store.setCookieScore(this.store.score - this.clickMultiplier.nextLevelPrice);
        this.increaseNextLevelPrice('manual');
      }
    },
    increaseAutoClick() {
      if (this.store.score >= this.autoClick.nextLevelPrice) {
        this.autoClick.level++;
        this.store.setAutoClick(this.autoClick);
        this.store.setCookieScore(this.store.score - this.autoClick.nextLevelPrice);
        this.increaseNextLevelPrice('auto');
        this.autoClicker();
      }
    },
    increaseNextLevelPrice(type) {
      if (type === 'manual') {
        const multiplier = 1.9;
        this.clickMultiplier.nextLevelPrice = Math.floor(this.clickMultiplier.nextLevelPrice * multiplier);
      }

      if (type === 'auto') {
        const multiplier = 2.7;
        this.autoClick.nextLevelPrice = Math.floor(this.autoClick.nextLevelPrice * multiplier);
      }
    },
    autoClicker() {
      if (this.autoClick.level > 1) {
        const clicksPerSecond = this.autoClick.level;
        clearInterval(this.intervalId); // Assuming you have an intervalId property
        this.intervalId = setInterval(() => this.updateInterval(clicksPerSecond), 1000 / clicksPerSecond);
      }
    },
    updateInterval(time) {
      this.store.score += Math.round(time);
    }
  },
};
</script>