<template>
  <div class="cookie">
    <img
        :src="cookieImg"
        :class="{ shake: cookieAnimation }"
        class="cookie--img"
        alt="Cookie"
        draggable="false"
        @mousedown="increaseScore(clickMultiplier.level)"
    >

    <div class="score">
      <div class="score--title">Score</div>
      <div class="score--value">{{ this.store.score }}</div>
    </div>
  </div>
</template>

<script>
import {useCookieStore} from "./../store/cookieStore";
import cookieImg from "./../assets/cookie.png"
export default {
  name: 'CookieClicker',
  data() {
    return {
      cookieImg: cookieImg,
      cookieAnimation: false,
      score: this.store.score,
      clickMultiplier: this.store.clickMultiplier,
    };
  },
  setup() {
    const store = useCookieStore();
    return {
      store,
    }
  },
  mounted() {
    this.score = this.store.getCookieScore();
  },
  methods: {
    increaseScore(multiplier) {
      this.store.score = this.store.score + multiplier;
      this.cookieAnimation = true
      setTimeout(() => {
        this.cookieAnimation = false
      }, 100)
    }
  },
};
</script>