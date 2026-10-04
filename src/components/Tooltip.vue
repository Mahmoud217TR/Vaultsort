<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useId } from 'vue'
const props = defineProps<{ text: string }>()
const id = useId()
const root = ref<HTMLElement>()
const detail = ref<HTMLElement>()
const open = ref(false)
const position = ref({ insetInlineStart: '0px', top: '0px' })
let timer: ReturnType<typeof setTimeout> | undefined
function escape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !open.value) return
  event.preventDefault(); event.stopImmediatePropagation(); hide()
}
async function show() {
  clearTimeout(timer)
  open.value = true
  window.addEventListener('keydown', escape, true)
  window.addEventListener('scroll', hide, true)
  window.addEventListener('resize', hide)
  await nextTick()
  if (!open.value || !root.value || !detail.value) return
  const trigger = root.value.getBoundingClientRect(), tooltip = detail.value.getBoundingClientRect()
  const left = Math.max(8, Math.min(trigger.left, innerWidth - tooltip.width - 8))
  const top = trigger.bottom + tooltip.height + 8 <= innerHeight ? trigger.bottom : Math.max(8, trigger.top - tooltip.height)
  // A transformed toast establishes a fixed-position containing block; dialogs do not.
  const parent = detail.value.offsetParent as HTMLElement | null
  const bounds = parent?.getBoundingClientRect()
  const localLeft = left - (bounds ? bounds.left + parent!.clientLeft : 0)
  const localTop = top - (bounds ? bounds.top + parent!.clientTop : 0)
  position.value = { insetInlineStart: `${document.documentElement.dir === 'rtl' ? (parent?.clientWidth ?? innerWidth) - localLeft - tooltip.width : localLeft}px`, top: `${localTop}px` }
}
function hide() { clearTimeout(timer); open.value = false; window.removeEventListener('keydown', escape, true); window.removeEventListener('scroll', hide, true); window.removeEventListener('resize', hide) }
function leave() { timer = setTimeout(() => { if (!root.value?.contains(document.activeElement)) hide() }, 100) }
function blur(event: FocusEvent) { if (!root.value?.contains(event.relatedTarget as Node | null)) hide() }
function associate() {
  const trigger = root.value?.querySelector<HTMLElement>('button, a, input, select, summary')
  if (!trigger) return
  const descriptions = new Set((trigger.getAttribute('aria-describedby') || '').split(' ').filter(Boolean))
  descriptions.add(id); trigger.setAttribute('aria-describedby', [...descriptions].join(' '))
  if (trigger.matches(':disabled')) { root.value!.tabIndex = 0; root.value!.setAttribute('aria-label', props.text); root.value!.setAttribute('aria-describedby', id) }
  else { root.value!.removeAttribute('tabindex'); root.value!.removeAttribute('aria-label'); root.value!.removeAttribute('aria-describedby') }
}
onMounted(associate)
onUpdated(associate)
onBeforeUnmount(hide)
</script>

<template>
  <span ref="root" class="action-help" @mouseenter="show" @mouseleave="leave" @focusin="show" @focusout="blur" @click="hide">
    <slot />
    <span :id="id" ref="detail" v-show="open" class="action-tooltip" role="tooltip" :style="position" @mouseenter="show" @mouseleave="leave">{{ text }}</span>
  </span>
</template>
