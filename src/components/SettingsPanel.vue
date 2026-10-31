<template>
  <div>
    <section class="card">
      <h3 class="heading">Display</h3>
      <label class="check"><input type="checkbox" v-model="store.settings.particles" /> Falling cookies in the background</label>
      <label class="check"><input type="checkbox" v-model="store.settings.floatingNumbers" /> Floating +N when clicking</label>
    </section>

    <section class="card">
      <h3 class="heading">Save</h3>
      <p class="muted">
        The game saves in this browser every few seconds and when you close the tab.
        Last saved {{ formatDuration((store.now - store.lastSaved) / 1000) }} ago.
      </p>
      <div class="row">
        <button type="button" class="btn" @click="store.save(); say('Saved.')">Save now</button>
        <button type="button" class="btn" @click="doExport">Export</button>
        <button type="button" class="btn" @click="doImport">Import</button>
      </div>
      <textarea
        v-model="text"
        class="save-box"
        rows="4"
        spellcheck="false"
        aria-label="Save text"
        placeholder="Press Export to get your save text, or paste one here and press Import."
      ></textarea>
      <p v-if="message" class="message" role="status">{{ message }}</p>
    </section>

    <section class="card danger">
      <h3 class="heading">Danger zone</h3>
      <button v-if="!confirming" type="button" class="btn danger" @click="confirming = true">Wipe save</button>
      <div v-else class="confirm">
        <span>Delete everything, including achievements and chips?</span>
        <button type="button" class="btn danger" @click="wipe">Yes, wipe it</button>
        <button type="button" class="btn" @click="confirming = false">Cancel</button>
      </div>
    </section>

    <p class="credit">
      Built with Vue 3, Pinia and Vite. Press <kbd>Space</kbd> or <kbd>Enter</kbd> on the focused cookie to bake.
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCookieStore } from '../store/cookieStore'
import { formatDuration } from '../game/engine'

const store = useCookieStore()
const text = ref('')
const message = ref('')
const confirming = ref(false)

function say(m) {
  message.value = m
}
async function doExport() {
  text.value = store.exportSave()
  try {
    await navigator.clipboard.writeText(text.value)
    say('Save text copied to the clipboard.')
  } catch {
    say('Copy the save text below and keep it somewhere safe.')
  }
}
function doImport() {
  if (!text.value.trim()) return say('Paste a save text first.')
  say(store.importSave(text.value) ? 'Save imported.' : 'That does not look like a valid save.')
}
function wipe() {
  store.hardReset()
  confirming.value = false
  text.value = ''
  say('Save wiped. Fresh start!')
}
</script>
