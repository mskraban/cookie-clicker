import {defineStore} from 'pinia'

export const useCookieStore = defineStore('cookie', {
    state: () => {
        return {
            score: 0,
            clickMultiplier: {
                level: 1,
                nextLevelPrice: 7
            },
        }
    },
    actions:{
        setCookieScore(payload) {
            this.score = payload;
        },
        getCookieScore() {
             return this.score;
        },
        setClickMultiplier(payload) {
            this.clickMultiplier = payload;
        },
        getClickMultiplier() {
            return this.clickMultiplier;
        },
    },
    persist: true,
})