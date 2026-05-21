<script setup>
import { CATEGORIES } from '../data/categories.js'

const activeCategory = defineModel('activeCategory', { type: String, required: true })
</script>

<template>
  <div
    class="flex gap-2 overflow-x-auto pb-1 scrollbar-thin [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    role="tablist"
    aria-label="课程分类"
  >
    <button
      v-for="cat in CATEGORIES"
      :key="cat.id"
      type="button"
      role="tab"
      :aria-selected="activeCategory === cat.id"
      class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
      :class="
        activeCategory === cat.id
          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
      "
      @click="activeCategory = cat.id"
    >
      {{ cat.label }}
    </button>
  </div>
</template>
