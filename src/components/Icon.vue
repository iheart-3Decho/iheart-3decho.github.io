<script setup lang="ts">
defineProps<{ name: string; size?: number }>();
const paths: Record<string, string> = {
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  play: "m9 5 11 7-11 7Z",
  pause: "M8 5v14M16 5v14",
  scan: "M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M7 12h10M12 7v10",
  video: "M3 5h14v14H3ZM17 10l4-3v10l-4-3",
  clock: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  ruler: "m4 16 12-12 4 4-12 12ZM8 12l2 2M11 9l2 2M14 6l2 2",
  arrow: "M4 12h16M14 6l6 6-6 6",
  chevron: "m9 6 6 6-6 6",
  info: "M12 11v6M12 7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  check: "m5 12 4 4L19 6",
  layers: "m12 3 10 5-10 5L2 8ZM2 12l10 5 10-5M2 16l10 5 10-5",
  reload: "M3 10a9 9 0 1 1 1 8M3 4v6h6",
  chart: "M4 4v16h16M8 14l4-6 4 3 4-6",
  report: "M14 3H5v18h14V8ZM14 3v5h5M8 12h8M8 16h6",
  print: "M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6ZM17 12h.01",
  folder: "M3 6h7l2 3h9v12H3ZM3 6V3h7l2 3h9v3",
};
</script>
<template>
  <svg
    :width="size || 20"
    :height="size || 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.heart" />
  </svg>
</template>
