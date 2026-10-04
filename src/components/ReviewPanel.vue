<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { duplicateLabel, findDuplicates, items, text, type DuplicateKind, type VaultExport, type ValidationBundle, type IssueRequest } from '../domain/vault'
import Icon from './Icon.vue'
import Tooltip from './Tooltip.vue'
const props = defineProps<{ document: VaultExport; validation: ValidationBundle }>()
const { t } = useI18n()
const emit = defineEmits<{ select: [index: number]; inspectIssue: [request: IssueRequest] }>()
const tab = ref<'duplicates' | 'validation'>('duplicates')
const kind = ref<DuplicateKind>('credential')
const duplicates = computed(() => findDuplicates(props.document))
const groups = computed(() => duplicates.value.filter(group => group.kind === kind.value))
const issues = computed(() => props.validation.issues)
const errors = computed(() => issues.value.filter(i => i.severity === 'error').length)
</script>

<template>
  <section class="review-panel">
    <div class="panel-heading"><div><span class="eyebrow">{{ t('review.eyebrow') }}</span><h1>{{ t('review.title') }}</h1><p class="muted">{{ t('review.description') }}</p></div><span class="heading-icon"><Icon name="review" :size="24" /></span></div>
    <div class="review-tabs"><button :class="{ active: tab === 'duplicates' }" :aria-pressed="tab === 'duplicates'" @click="tab = 'duplicates'">{{ t('review.duplicates') }}<span class="count-pill">{{ duplicates.length }}</span></button><button :class="{ active: tab === 'validation' }" :aria-pressed="tab === 'validation'" @click="tab = 'validation'">{{ t('review.validation') }}<span class="count-pill">{{ issues.length }}</span></button></div>
    <div class="review-content">
      <template v-if="tab === 'duplicates'">
        <label class="field-label review-filter">{{ t('review.rule') }}<select v-model="kind"><option v-for="(label, key) in duplicateLabel" :key="key" :value="key">{{ t(label) }}</option></select></label>
        <p class="hint">{{ t('review.hint') }}</p>
        <div v-for="(group, i) in groups" :key="i" class="duplicate-card"><header><span><Icon name="copy" :size="15" />{{ t(duplicateLabel[group.kind]) }}</span><span class="muted">{{ t('common.items', { count: group.indexes.length }) }}</span></header><button v-for="index in group.indexes" :key="index" @click="emit('select', index)"><span><Icon name="key" :size="15" /><bdi>{{ text(items(document)[index]?.name) || t('common.untitled') }}</bdi></span><span class="muted">{{ t('common.itemNumber', { index: index + 1 }) }}<Icon name="chevron" :size="14" /></span></button></div>
        <div v-if="!groups.length" class="empty-state"><span class="empty-icon"><Icon name="check" :size="28" /></span><h3>{{ t('review.none') }}</h3><p>{{ t('review.try') }}</p></div>
      </template>
      <template v-else>
        <div class="validation-summary"><span :class="errors ? 'error-badge' : 'success-badge'"><Icon :name="errors ? 'warning' : 'check'" :size="16" />{{ t('common.errors', { count: errors }) }}</span><span class="warning-badge">{{ t('common.warnings', { count: issues.length - errors }) }}</span></div>
        <p class="hint">{{ t('review.validationHint') }}</p>
        <div v-for="(issue, index) in issues" :key="index" :class="['issue-row', issue.severity]"><Icon :name="issue.severity === 'error' ? 'warning' : 'review'" :size="17" /><div><p>{{ t(issue.message) }}</p><Tooltip v-if="issue.itemIndex !== undefined" :text="t('workspace.helpWarning')"><button class="text-button" @click="emit('inspectIssue', { revision: validation.revision, issue })">{{ t('common.inspectItem', { index: issue.itemIndex! + 1 }) }}<Icon name="arrow" :size="13" /></button></Tooltip><span v-else-if="issue.folderIndex !== undefined" class="muted text-xs">{{ t('common.folderNumber', { index: issue.folderIndex + 1 }) }}</span></div></div>
        <div v-if="!issues.length" class="empty-state"><span class="empty-icon"><Icon name="check" :size="28" /></span><h3>{{ t('review.valid') }}</h3><p>{{ t('review.ready') }}</p></div>
      </template>
    </div>
  </section>
</template>
