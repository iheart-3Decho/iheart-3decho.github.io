<script setup lang="ts">
defineProps<{ kind: string; compact?: boolean }>();
</script>
<template>
  <svg
    viewBox="0 0 320 205"
    class="w-full"
    :class="compact ? 'h-[125px]' : 'h-[190px]'"
    role="img"
    :aria-label="
      kind === 'ed'
        ? '心室充盈較大的示意'
        : kind === 'es'
          ? '心室收縮較小的示意'
          : '心室內徑與壁厚的解剖示意'
    "
  >
    <defs>
      <linearGradient id="chamber-fill" x2="0" y2="1">
        <stop stop-color="#60c7c5" stop-opacity=".3" />
        <stop offset="1" stop-color="#147e7d" stop-opacity=".08" />
      </linearGradient>
    </defs>
    <path
      d="M157 30C191 49 231 82 239 126C248 177 200 192 164 185C127 180 81 160 91 112C101 64 132 49 157 30Z"
      fill="#e1efed"
      stroke="#93bfb8"
      stroke-width="14"
    />
    <path
      v-if="kind === 'es'"
      d="M163 52C180 67 199 96 200 129C202 157 181 161 164 157C141 154 124 139 130 113C136 87 145 67 163 52Z"
      fill="url(#chamber-fill)"
      stroke="#147e7d"
      stroke-width="3"
    />
    <path
      v-else
      d="M158 43C183 58 215 90 222 127C227 161 195 176 164 169C132 163 104 150 110 117C117 80 138 60 158 43Z"
      fill="url(#chamber-fill)"
      stroke="#147e7d"
      stroke-width="3"
    />
    <g v-if="['lvidd', 'lvids'].includes(kind)" stroke="#3272b9" stroke-width="3">
      <path d="m122 127 95-14" />
      <circle cx="122" cy="127" r="5" fill="#3272b9" />
      <circle cx="217" cy="113" r="5" fill="#3272b9" />
    </g>
    <g v-if="kind === 'ivsd'" stroke="#3272b9" stroke-width="3">
      <path d="m124 69 14 12" />
      <circle cx="124" cy="69" r="5" fill="#3272b9" />
      <circle cx="138" cy="81" r="5" fill="#3272b9" />
    </g>
    <g v-if="kind === 'lvpwd'" stroke="#3272b9" stroke-width="3">
      <path d="m212 150 14 8" />
      <circle cx="212" cy="150" r="5" fill="#3272b9" />
      <circle cx="226" cy="158" r="5" fill="#3272b9" />
    </g>
    <g v-if="kind === 'ed'" fill="#147e7d">
      <path d="m65 68 22 14-22 14v-9H43v-10h22Z" />
      <path d="m270 68-22 14 22 14v-9h22v-10h-22Z" />
    </g>
    <g v-if="kind === 'es'" fill="#3272b9"><path d="m155 18 13-16 13 16h-8v24h-10V18Z" /></g>
    <text x="160" y="202" text-anchor="middle" fill="#78919a" font-size="11">
      解剖示意 · 非病例影像
    </text>
  </svg>
</template>
