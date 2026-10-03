<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 18 })
const paths: Record<string, string> = {
  shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  folder: 'M3 7V5h6l2 2h10v13H3V7Z',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z',
  key: 'M15 12a5 5 0 1 0-3-9 5 5 0 0 0 3 9ZM11 11l-8 8v2h3v-3h3v-3l3-3',
  note: 'M5 3h10l4 4v14H5V3Zm10 0v5h4M8 12h8M8 16h6',
  card: 'M3 5h18v14H3V5Zm0 5h18M6 15h4',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a8 8 0 0 1 16 0v3',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Zm-2 5 6 6',
  plus: 'M12 5v14M5 12h14',
  upload: 'M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5',
  download: 'M12 3v13m-5-5 5 5 5-5M4 16v5h16v-5',
  chevron: 'm9 5 7 7-7 7',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  lock: 'M5 10h14v11H5V10Zm3 0V7a4 4 0 0 1 8 0v3',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  eyeOff: 'm3 3 18 18M10 5c7-1 12 7 12 7s-2 3-5 5M6 6c-3 2-4 6-4 6s4 7 10 7c2 0 4-1 4-1',
  copy: 'M9 9h12v12H9V9ZM5 15H3V3h12v2',
  undo: 'm8 4-5 5 5 5M3 9h11a7 7 0 0 1 0 14',
  redo: 'm16 4 5 5-5 5M21 9H10a7 7 0 0 0 0 14',
  warning: 'm12 3 10 18H2L12 3Zm0 6v5m0 3h.01',
  review: 'M9 3h6v4H9V3ZM9 5H5v16h14V5h-4M8 12h8M8 16h5',
  trash: 'M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  edit: 'm15 3 6 6-12 12H3v-6L15 3Zm-3 3 6 6',
  logout: 'M10 3H4v18h6m5-14 5 5-5 5m-7-5h12',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-18 0h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
  filter: 'M3 5h18M6 12h12M9 19h6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  file: 'M5 3h10l4 4v14H5V3Zm10 0v5h4M9 12l-2 2 2 2m6-4 2 2-2 2',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
}
</script>

<template>
  <svg :class="{ 'directional-icon': ['arrow', 'chevron', 'undo', 'redo', 'logout'].includes(name) }" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.file" /></svg>
</template>
