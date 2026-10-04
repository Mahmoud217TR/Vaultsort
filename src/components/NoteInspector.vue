<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from './Modal.vue'
import Icon from './Icon.vue'
import Tooltip from './Tooltip.vue'
const props = defineProps<{ text: string; trigger: HTMLElement | null; fallback?: HTMLElement }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const titleId = useId()
const native = typeof HTMLElement.prototype.showPopover === 'function'
const popover = ref<HTMLElement>()
const closeButton = ref<HTMLButtonElement>()
let dismissed = false
let restoreFocus = true
function dismiss(restore = true) {
  if (dismissed) return
  dismissed = true
  restoreFocus = restore
  emit('close')
}
function escape(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopImmediatePropagation()
  dismiss()
}
function toggle(event: Event) {
  if ((event as ToggleEvent).newState === 'closed') dismiss(false)
}
// Own Escape before the fallback dialog's focused Close button can show action help.
window.addEventListener('keydown', escape, true)
onMounted(() => {
  if (native) { popover.value?.showPopover(); closeButton.value?.focus() }
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', escape, true)
  popover.value?.hidePopover?.()
  if (restoreFocus) nextTick(() => (props.trigger?.isConnected ? props.trigger : props.fallback)?.focus({ preventScroll: true }))
})
</script>

<template>
  <section v-if="native" ref="popover" class="note-inspector" popover="auto" role="dialog" :aria-labelledby="titleId" @toggle="toggle">
    <header><h2 :id="titleId">{{ t('workspace.noteTitle') }}</h2><Tooltip :text="t('workspace.helpDialogClose')"><button ref="closeButton" class="icon-button" :aria-label="t('common.closeDialog')" @click="dismiss()"><Icon name="close" /></button></Tooltip></header>
    <div class="note-text" dir="auto">{{ text }}</div>
  </section>
  <Modal v-else :title="t('workspace.noteTitle')" @close="dismiss()"><div class="note-text" dir="auto">{{ text }}</div></Modal>
</template>
