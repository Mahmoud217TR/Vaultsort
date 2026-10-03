import { computed, ref, shallowRef } from 'vue'
import { clone, parseVault, serializeVault, type VaultExport } from '../domain/vault'
import type { Message } from '../i18n'

interface Snapshot { document: VaultExport; changes: (Message | string)[] }
export function useVault() {
  const originalDocument = shallowRef<VaultExport | null>(null)
  const originalBytes = shallowRef<ArrayBuffer | null>(null)
  const workingDocument = shallowRef<VaultExport | null>(null)
  const originalName = ref('')
  const changes = ref<(Message | string)[]>([])
  const past = shallowRef<Snapshot[]>([])
  const future = shallowRef<Snapshot[]>([])
  const exported = ref<string | null>(null)
  const dirty = computed(() => !!workingDocument.value && serializeVault(workingDocument.value) !== (exported.value ?? serializeVault(originalDocument.value!)))
  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function load(bytes: ArrayBuffer, name: string) {
    const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    const parsed = parseVault(source)
    const original = clone(parsed)
    const working = clone(parsed)
    const copy = bytes.slice(0)
    close()
    originalBytes.value = copy
    originalDocument.value = original
    workingDocument.value = working
    originalName.value = name
  }
  function commit(description: Message | string, operation: (doc: VaultExport) => void) {
    if (!workingDocument.value) return
    const next = clone(workingDocument.value)
    operation(next)
    if (serializeVault(next) === serializeVault(workingDocument.value)) return
    // ponytail: at most 30 full snapshots; use commands if large vaults make history expensive.
    past.value = [...past.value, { document: workingDocument.value, changes: [...changes.value] }].slice(-30)
    future.value = []
    workingDocument.value = next
    changes.value = [...changes.value, description]
  }
  function undo() {
    const previous = past.value.at(-1)
    if (!previous || !workingDocument.value) return
    future.value = [...future.value, { document: workingDocument.value, changes: [...changes.value] }]
    past.value = past.value.slice(0, -1)
    workingDocument.value = previous.document
    changes.value = previous.changes
  }
  function redo() {
    const next = future.value.at(-1)
    if (!next || !workingDocument.value) return
    past.value = [...past.value, { document: workingDocument.value, changes: [...changes.value] }]
    future.value = future.value.slice(0, -1)
    workingDocument.value = next.document
    changes.value = next.changes
  }
  function markExported() { if (workingDocument.value) exported.value = serializeVault(workingDocument.value) }
  function close() {
    workingDocument.value = null
    originalDocument.value = null
    originalBytes.value = null
    originalName.value = ''
    changes.value = []
    past.value = []
    future.value = []
    exported.value = null
  }
  return { originalDocument, originalBytes, originalName, workingDocument, changes, dirty, canUndo, canRedo, load, commit, undo, redo, markExported, close }
}
