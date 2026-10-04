<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { duplicateLabel, type CandidateRequest, type ComparisonViewRow, type DuplicateRequest } from '../domain/vault'
const props = defineProps<{ request: DuplicateRequest; candidates: { index: number; name: string }[]; rows: ComparisonViewRow[]; renameIndex: number | null }>()
const emit = defineEmits<{ back: []; ignore: [request: DuplicateRequest]; renameStart: [request: CandidateRequest]; rename: [request: CandidateRequest]; delete: [request: CandidateRequest]; cancelRename: []; dirty: [value: boolean] }>()
const { t } = useI18n()
const name = ref(''), initialName = ref('')
const dirty = computed(() => props.renameIndex !== null && name.value !== initialName.value)
watch(dirty, value => emit('dirty', value), { immediate: true, flush: 'sync' })
watch(() => props.renameIndex, index => { name.value = initialName.value = props.candidates.find(candidate => candidate.index === index)?.name ?? '' }, { immediate: true })
function cancelRename() {
  if (dirty.value && !window.confirm(t('comparison.discard'))) return
  emit('cancelRename')
}
</script>

<template>
  <section class="duplicate-comparison" :aria-label="t('comparison.title')">
    <div class="comparison-actions"><button class="button small comparison-back" @click="emit('back')">{{ t('comparison.back') }}</button><strong>{{ t(duplicateLabel[request.kind]) }}</strong><span>{{ t('common.items', { count: candidates.length }) }}</span><button class="button small ignore-group" @click="emit('ignore', request)">{{ t('comparison.ignore') }}</button></div>
    <p class="hint">{{ t('comparison.help') }}</p>
    <form v-if="renameIndex !== null" class="comparison-name-form" autocomplete="off" @submit.prevent="emit('rename', { group: request, index: renameIndex!, name })">
      <label class="field-label">{{ t('comparison.renameLabel', { index: renameIndex + 1 }) }}<input v-model="name" class="comparison-name-input" dir="auto" /></label>
      <div class="comparison-actions"><button class="button small" type="button" @click="cancelRename">{{ t('common.cancel') }}</button><button class="button primary small" :disabled="!dirty">{{ t('common.apply') }}</button></div>
    </form>
    <div class="comparison-scroll" tabindex="0" role="region" :aria-label="t('comparison.scroll')">
      <table class="comparison-table">
        <thead><tr><th scope="col">{{ t('comparison.fieldHeading') }}</th><th v-for="candidate in candidates" :key="candidate.index" scope="col"><span class="candidate-name"><bdi>{{ candidate.name || t('common.untitled') }}</bdi></span><span>{{ t('common.itemNumber', { index: candidate.index + 1 }) }}</span><div class="comparison-actions"><button class="button small rename-candidate" :aria-label="t('comparison.renameNumber', { index: candidate.index + 1 })" @click="emit('renameStart', { group: request, index: candidate.index })">{{ t('comparison.rename') }}</button><button class="button small danger delete-candidate" :aria-label="t('comparison.deleteNumber', { index: candidate.index + 1 })" @click="emit('delete', { group: request, index: candidate.index })">{{ t('comparison.delete') }}</button></div></th></tr></thead>
        <tbody><tr v-for="row in rows" :key="row.id" :class="{ 'comparison-different': row.different }"><th scope="row"><bdi v-if="row.label" dir="ltr">{{ row.label }}</bdi><span v-else>{{ t(row.labelKey, { index: row.id + 1 }) }}</span><span class="comparison-status">{{ t(row.different ? 'comparison.different' : 'comparison.equal') }}</span></th><td v-for="(value, index) in row.values" :key="index"><div class="comparison-value" tabindex="0" :dir="value.state === 'value' ? 'ltr' : undefined"><bdi v-if="value.state === 'value'" :dir="row.labelKey === 'editor.name' ? 'auto' : 'ltr'">{{ value.text }}</bdi><span v-else>{{ t(`comparison.${value.state}`) }}</span></div></td></tr></tbody>
      </table>
    </div>
  </section>
</template>
