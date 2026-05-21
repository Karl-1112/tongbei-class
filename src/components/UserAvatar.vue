<script setup>
import { computed } from 'vue'
import { DEFAULT_AVATAR_SVG } from '../utils/defaultAvatar.js'

const props = defineProps({
  src: { type: String, default: '' },
  name: { type: String, default: '' },
  size: { type: String, default: 'md' },
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-8 w-8'
  if (props.size === 'lg') return 'h-16 w-16'
  return 'h-10 w-10'
})

const imgSrc = computed(() => props.src || DEFAULT_AVATAR_SVG)
</script>

<template>
  <img
    :src="imgSrc"
    :alt="name ? `${name} 的头像` : '用户头像'"
    class="shrink-0 rounded-full object-cover ring-2 ring-white shadow-md"
    :class="sizeClass"
  />
</template>
