<script setup>
defineProps({
  searchQuery: { type: String, default: '' },
  categoryLabel: { type: String, default: '' },
})
</script>

<template>
  <div
    class="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center"
  >
    <div
      class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl"
    >
      🔍
    </div>
    <h3 class="text-lg font-semibold text-slate-800">没有找到相关课程</h3>
    <p class="mt-2 max-w-sm text-sm text-slate-500">
      换个词试试吧～
      <template v-if="searchQuery">
        当前搜索「<span class="font-medium text-slate-700">{{ searchQuery }}</span>」
      </template>
      <template v-if="categoryLabel && categoryLabel !== '全部'">
        ，分类「{{ categoryLabel }}」下暂无匹配
      </template>
    </p>
  </div>
</template>
