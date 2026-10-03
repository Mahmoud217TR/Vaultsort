<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { errorMessage, translate, type Message } from '../i18n'
import { clone, fields, folderName, folders, isObject, login, maskUsername, organizationName, parseRawItem, scalar, serializeVault, text, typeName, uris, type VaultExport, type VaultItem } from '../domain/vault'
import Icon from './Icon.vue'

const props = defineProps<{ item: VaultItem; index: number; document: VaultExport; privacy: boolean }>()
const { t } = useI18n()
const emit = defineEmits<{ save: [item: VaultItem, description: Message]; close: []; dirty: [value: boolean]; notice: [message: string] }>()
const draft = ref<VaultItem>(clone(props.item))
const passwordVisible = ref(false)
const totpVisible = ref(false)
const tab = ref<'details' | 'raw'>('details')
const raw = ref(JSON.stringify(props.item, null, 2))
const error = ref<Message | null>(null)
const rawDirty = computed(() => raw.value !== JSON.stringify(props.item, null, 2))
const formDirty = computed(() => serializeVault(draft.value) !== serializeVault(props.item))
const dirty = computed(() => tab.value === 'raw' ? rawDirty.value : formDirty.value)
watch(dirty, value => emit('dirty', value), { immediate: true })
watch(() => props.item, value => {
  draft.value = clone(value)
  raw.value = JSON.stringify(value, null, 2)
  error.value = null
  passwordVisible.value = false
  totpVisible.value = false
})
watch(() => props.privacy, () => { passwordVisible.value = false; totpVisible.value = false; if (props.privacy) tab.value = 'details' })
const value = (event: Event) => (event.target as HTMLInputElement).value
const checked = (event: Event) => (event.target as HTMLInputElement).checked
const maskedUsername = computed(() => {
  const username = text(login(draft.value).username)
  return maskUsername(username)
})
function setLogin(key: string, next: unknown) {
  if (props.privacy && ['username', 'password', 'totp'].includes(key)) return
  draft.value.login = { ...login(draft.value), [key]: next }
}
function setUri(index: number, key: string, next: unknown) {
  setLogin('uris', uris(draft.value).map((entry, i) => i === index ? { ...(isObject(entry) ? entry : {}), [key]: next } : entry))
}
function setField(index: number, key: string, next: unknown) {
  if (props.privacy && key === 'value') return
  draft.value.fields = fields(draft.value).map((field, i) => i === index ? { ...(isObject(field) ? field : {}), [key]: next } : field)
}
function switchTab(next: 'details' | 'raw') {
  if (next === tab.value) return
  if (dirty.value && !window.confirm(t('confirm.discardEditor'))) return
  draft.value = clone(props.item)
  raw.value = JSON.stringify(props.item, null, 2)
  error.value = null
  tab.value = next
}
function save() {
  try {
    const next = tab.value === 'raw' ? parseRawItem(raw.value) : clone(draft.value)
    for (const key of ['organizationId', 'collectionIds']) {
      if (JSON.stringify(next[key]) !== JSON.stringify(props.item[key]) && !window.confirm(t('confirm.ownership'))) return
    }
    const description: string[] = []
    for (const key of ['name', 'folderId', 'favorite', 'notes', 'fields']) {
      if (JSON.stringify(next[key]) !== JSON.stringify(props.item[key])) description.push(key === 'favorite' ? 'audit.favoriteField' : `audit.${key}`)
    }
    for (const key of ['username', 'password', 'totp', 'uris']) {
      if (JSON.stringify(login(next)[key]) !== JSON.stringify(login(props.item)[key])) description.push(`audit.${key}`)
    }
    emit('save', next, { key: tab.value === 'raw' ? 'audit.raw' : 'audit.item', params: { index: props.index + 1 }, fields: description.length ? description : ['audit.itemField'] })
    draft.value = clone(next)
    raw.value = JSON.stringify(next, null, 2)
    error.value = null
  } catch (e) { error.value = errorMessage(e, 'errors.item') }
}
async function copyPassword() {
  if (props.privacy) return
  try {
    await navigator.clipboard.writeText(text(login(draft.value).password))
    emit('notice', 'notice.copied')
  } catch { emit('notice', 'notice.clipboardFailed') }
}
function reset() {
  draft.value = clone(props.item)
  raw.value = JSON.stringify(props.item, null, 2)
  error.value = null
}
</script>

<template>
  <aside class="item-editor" :aria-label="t('editor.label')">
    <header class="editor-header"><span class="eyebrow">{{ t('editor.title') }}</span><button class="icon-button" :aria-label="t('editor.close')" @click="emit('close')"><Icon name="close" :size="16" /></button></header>
    <div class="editor-identity"><span class="item-avatar large"><Icon :name="item.type === 1 ? 'key' : item.type === 2 ? 'note' : item.type === 3 ? 'card' : 'user'" :size="24" /></span><div><h2><bdi>{{ text(item.name) || t('common.untitled') }}</bdi></h2><span class="muted text-xs">{{ typeName(item.type) }}<span class="dot-separator">{{ t('common.dot') }}</span><bdi>{{ folderName(document, item.folderId) }}</bdi></span></div></div>
    <nav class="editor-tabs" :aria-label="t('editor.view')"><button :class="{ active: tab === 'details' }" :aria-pressed="tab === 'details'" @click="switchTab('details')">{{ t('editor.details') }}</button><button :class="{ active: tab === 'raw' }" :aria-pressed="tab === 'raw'" @click="switchTab('raw')"><Icon name="file" :size="14" />{{ t('editor.raw') }}</button></nav>
    <form class="editor-scroll" autocomplete="off" @submit.prevent="save">
      <div v-if="tab === 'raw'" class="raw-editor">
        <p class="hint">{{ t('editor.rawHint') }}</p>
        <div v-if="privacy" class="privacy-placeholder"><Icon name="eyeOff" /><p>{{ t('editor.rawPrivacy') }}</p></div>
        <label v-else class="field-label">{{ t('editor.json') }}<textarea v-model="raw" class="code-input" dir="ltr" rows="24" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" data-lpignore="true" data-1p-ignore /></label>
      </div>
      <template v-else>
        <section class="editor-section"><h3>{{ t('editor.general') }}</h3>
          <label class="field-label">{{ t('editor.name') }}<input :value="text(draft.name)" dir="auto" @input="draft.name = value($event)" autocomplete="off" /></label>
          <label class="field-label">{{ t('workspace.folder') }}<select :value="text(draft.folderId)" @change="draft.folderId = value($event) || null"><option value="">{{ t('common.unassigned') }}</option><option v-for="(folder, i) in folders(document)" :key="i" :value="text(folder.id)" :disabled="!text(folder.id)">{{ folder.name || t('common.unnamedFolder') }}</option><option v-if="text(draft.folderId) && !folders(document).some(f => f.id === draft.folderId)" :value="text(draft.folderId)">{{ t('common.missingFolder') }}</option></select></label>
          <label class="checkbox-label"><input type="checkbox" :checked="draft.favorite === true" @change="draft.favorite = checked($event)" /><Icon name="star" :size="15" />{{ t('editor.favorite') }}</label>
        </section>
        <template v-if="draft.type === 1">
          <section class="editor-section"><h3>{{ t('editor.credentials') }}<Icon name="lock" :size="13" /></h3>
            <p v-if="!isObject(draft.login)" class="inline-warning">{{ t('editor.malformedLogin') }}</p>
            <label class="field-label">{{ t('editor.username') }}<div class="input-wrap"><input :value="privacy ? maskedUsername : text(login(draft).username)" dir="auto" :readonly="privacy" :placeholder="t(privacy ? 'editor.hiddenPlaceholder' : 'editor.usernamePlaceholder')" @input="setLogin('username', value($event))" autocomplete="off" autocapitalize="off" spellcheck="false" data-lpignore="true" data-1p-ignore /><Icon v-if="privacy" name="eyeOff" :size="15" /></div></label>
            <label class="field-label">{{ t('editor.password') }}<div class="input-wrap"><input :value="privacy ? '••••••••' : text(login(draft).password)" dir="auto" :readonly="privacy" :type="passwordVisible && !privacy ? 'text' : 'password'" @input="setLogin('password', value($event))" autocomplete="new-password" spellcheck="false" data-lpignore="true" data-1p-ignore /><div class="input-actions"><button type="button" class="icon-button" :disabled="privacy" :aria-label="t(passwordVisible ? 'editor.hidePassword' : 'editor.revealPassword')" @click="passwordVisible = !passwordVisible"><Icon :name="passwordVisible ? 'eyeOff' : 'eye'" :size="16" /></button><button type="button" class="icon-button" :disabled="privacy" :aria-label="t('editor.copyPassword')" @click="copyPassword"><Icon name="copy" :size="15" /></button></div></div></label>
            <p v-if="privacy" class="hint"><Icon name="eyeOff" :size="12" />{{ t('editor.privacyHint') }}</p>
          </section>
          <section class="editor-section"><h3>{{ t('editor.uris') }}<button type="button" class="text-button" @click="setLogin('uris', [...uris(draft), { uri: '', match: null }])"><Icon name="plus" :size="13" />{{ t('common.add') }}</button></h3>
            <p v-if="!uris(draft).length" class="hint">{{ t('editor.noUris') }}</p>
            <div v-for="(entry, i) in uris(draft)" :key="i" class="uri-row">
              <div class="uri-input"><Icon name="globe" :size="15" /><input :aria-label="t('editor.uri', { index: i + 1 })" :value="isObject(entry) ? text(entry.uri) : ''" dir="ltr" @input="setUri(i, 'uri', value($event))" :placeholder="t('editor.uriPlaceholder')" autocomplete="off" spellcheck="false" /><button type="button" class="icon-button" :aria-label="t('editor.deleteUri', { index: i + 1 })" @click="setLogin('uris', uris(draft).filter((_, index) => index !== i))"><Icon name="close" :size="14" /></button></div>
              <label class="match-label">{{ t('editor.match') }}<select :value="isObject(entry) && entry.match != null ? scalar(entry.match) : ''" @change="setUri(i, 'match', value($event) === '' ? null : Number(value($event)))"><option value="">{{ t('editor.matchDefault') }}</option><option v-for="(key, index) in ['matchDomain', 'matchHost', 'matchStarts', 'matchExact', 'matchRegex', 'matchNever']" :key="key" :value="index">{{ t(`editor.${key}`) }}</option><option v-if="isObject(entry) && entry.match != null && ![0, 1, 2, 3, 4, 5].includes(entry.match as number)" :value="scalar(entry.match)" disabled>{{ t('editor.unknown') }}</option></select></label>
            </div>
          </section>
          <section class="editor-section"><h3>{{ t('editor.twoFactor') }}</h3><label class="field-label">{{ t('editor.totp') }}<div class="input-wrap"><input :value="privacy ? '••••••••' : text(login(draft).totp)" dir="ltr" :readonly="privacy" :type="totpVisible && !privacy ? 'text' : 'password'" @input="setLogin('totp', value($event))" autocomplete="new-password" spellcheck="false" data-lpignore="true" data-1p-ignore /><button type="button" class="icon-button" :disabled="privacy" :aria-label="t(totpVisible ? 'editor.hideTotp' : 'editor.revealTotp')" @click="totpVisible = !totpVisible"><Icon :name="totpVisible ? 'eyeOff' : 'eye'" :size="16" /></button></div></label></section>
        </template>
        <section class="editor-section"><h3>{{ t('editor.notes') }}</h3><div v-if="privacy" class="privacy-note"><Icon name="eyeOff" :size="15" />{{ t('editor.notesHidden') }}</div><label v-else class="field-label"><span class="sr-only">{{ t('editor.notes') }}</span><textarea :value="text(draft.notes)" dir="auto" @input="draft.notes = value($event)" rows="4" :placeholder="t('editor.notesPlaceholder')" autocomplete="off" spellcheck="false" /></label></section>
        <section class="editor-section"><h3>{{ t('editor.custom') }}<button type="button" class="text-button" @click="draft.fields = [...fields(draft), { name: '', value: '', type: 0 }]"><Icon name="plus" :size="13" />{{ t('common.add') }}</button></h3>
          <p v-if="!fields(draft).length" class="hint">{{ t('editor.noCustom') }}</p>
          <div v-for="(field, i) in fields(draft)" :key="i" class="custom-field">
            <template v-if="isObject(field)">
              <div class="custom-field-top"><input :aria-label="t('editor.fieldName', { index: i + 1 })" :value="text(field.name)" dir="auto" @input="setField(i, 'name', value($event))" :placeholder="t('editor.fieldPlaceholder')" autocomplete="off" /><button type="button" class="icon-button" :aria-label="t('editor.deleteField', { index: i + 1 })" @click="draft.fields = fields(draft).filter((_, index) => index !== i)"><Icon name="trash" :size="15" /></button></div>
              <select :aria-label="t('editor.fieldType', { index: i + 1 })" :value="field.type == null ? '0' : scalar(field.type)" @change="setField(i, 'type', Number(value($event)))"><option value="0">{{ t('editor.text') }}</option><option value="1">{{ t('editor.hidden') }}</option><option value="2">{{ t('editor.boolean') }}</option><option v-if="field.type != null && ![0, 1, 2].includes(field.type as number)" :value="scalar(field.type)" disabled>{{ t('editor.unsupported') }}</option></select>
              <div v-if="privacy && field.type === 2" class="privacy-note"><Icon name="eyeOff" :size="15" />{{ t('editor.valueHidden') }}</div>
              <label v-else-if="field.type === 2" class="checkbox-label"><input type="checkbox" :checked="field.value === 'true' || field.value === true" @change="setField(i, 'value', checked($event) ? 'true' : 'false')" />{{ t('editor.value') }}</label>
              <input v-else-if="[0, 1].includes((field.type ?? 0) as number)" :aria-label="t('editor.fieldValue', { index: i + 1 })" :value="privacy ? '••••••••' : text(field.value)" dir="auto" :readonly="privacy" :type="privacy || field.type === 1 ? 'password' : 'text'" @input="setField(i, 'value', value($event))" autocomplete="new-password" spellcheck="false" data-lpignore="true" data-1p-ignore />
            </template><p v-else class="inline-warning">{{ t('editor.malformedField') }}</p>
          </div>
        </section>
        <section v-if="item.type !== 1 && item.type !== 2" class="editor-section"><p class="hint">{{ t('editor.preserved', { type: typeName(item.type) }) }}</p></section>
        <details class="editor-section metadata"><summary>{{ t('editor.metadata') }}<Icon name="chevron" :size="14" /></summary><dl><template v-for="key in ['id', 'organizationId', 'revisionDate', 'creationDate', 'deletedDate', 'type']" :key="key"><dt>{{ t(`editor.${key}`) }}</dt><dd><bdi>{{ scalar(item[key]) }}</bdi></dd></template></dl><i18n-t v-if="item.organizationId" keypath="editor.ownership" tag="p" class="hint" scope="global"><template #name><bdi>{{ organizationName(document, item.organizationId) }}</bdi></template></i18n-t></details>
      </template>
      <p v-if="error" role="alert" class="error-message">{{ translate(error) }}</p>
    </form>
    <footer class="editor-footer"><span class="text-xs muted">{{ t(dirty ? 'editor.dirty' : 'editor.clean') }}</span><div class="flex gap-2"><button class="button small" :disabled="!dirty" @click="reset">{{ t('common.reset') }}</button><button class="button primary small" :disabled="!dirty || (tab === 'raw' && privacy)" @click="save"><Icon name="check" :size="14" />{{ t('common.apply') }}</button></div></footer>
  </aside>
</template>
