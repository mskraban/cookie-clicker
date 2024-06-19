<template>
  <div class="upgrades">
    <button
        @click="increaseClickLevel"
        class="upgrade"
    >
      <img
          :src="cursorIcon"
          class="icon"
          alt="Cursor icon"
      />
      <span class="title">{{ clickMultiplier.level + 1 }}x Click</span>
      <span class="price">{{ clickMultiplier.nextLevelPrice }}</span>
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
      clickMultiplier: {
        level: this.store.clickMultiplier.level,
        nextLevelPrice: this.store.clickMultiplier.nextLevelPrice
      },
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
    console.log(this.store.getClickMultiplier())
  },
  methods: {
    increaseClickLevel() {
      if (this.store.score >= this.clickMultiplier.nextLevelPrice) {
        this.clickMultiplier.level++;
        this.store.setClickMultiplier(this.clickMultiplier);
        this.store.setCookieScore(this.store.score - this.clickMultiplier.nextLevelPrice);
        this.increaseNextLevelPrice();
      }
    },
    increaseNextLevelPrice() {
      const multiplier = 1.9;
      this.clickMultiplier.nextLevelPrice = Math.floor(this.clickMultiplier.nextLevelPrice * multiplier);
    }
  },
};
</script>