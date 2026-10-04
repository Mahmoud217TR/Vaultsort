<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from './Icon.vue'
import Tooltip from './Tooltip.vue'
defineProps<{ title: string; wide?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
const { t } = useI18n()
onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => dialog.value?.close?.())
</script>

<template>
  <dialog ref="dialog" :class="['modal', { wide }]" aria-labelledby="modal-title" @cancel.prevent="emit('close')" @click="($event.target === dialog) && emit('close')">
    <header class="modal-header"><h2 id="modal-title">{{ title }}</h2><Tooltip :text="t('workspace.helpDialogClose')"><button class="icon-button" :aria-label="t('common.closeDialog')" @click="emit('close')"><Icon name="close" /></button></Tooltip></header>
    <div class="modal-body"><slot /></div>
    <footer v-if="$slots.footer" class="modal-footer"><slot name="footer" /></footer>
  </dialog>
</template>
