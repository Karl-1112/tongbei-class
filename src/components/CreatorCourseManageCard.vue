<script setup>
defineProps({
  course: { type: Object, required: true },
})

defineEmits(['edit', 'delete'])
</script>

<template>
  <article
    class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:shadow-md"
  >
    <div class="relative aspect-video bg-slate-100">
      <img
        v-if="course.cover"
        :src="course.cover"
        :alt="course.title"
        class="h-full w-full object-cover"
      />
      <div
        v-else
        class="flex h-full items-center justify-center text-4xl text-slate-300"
      >
        📚
      </div>
      <span
        v-if="course.isFree"
        class="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white"
      >
        免费
      </span>
      <span
        class="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-600"
      >
        {{ course.categoryLabel }}
      </span>
    </div>

    <div class="p-4">
      <h3 class="line-clamp-2 font-bold text-slate-900">{{ course.title }}</h3>
      <p class="mt-1 text-sm text-slate-500">
        {{ course.isFree ? '免费公益' : `${course.pointsCost} 积分` }}
        · {{ course.syllabus?.chapters?.length ?? 0 }} 章
      </p>

      <div class="mt-4 flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-lg border border-violet-200 bg-violet-50 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
          @click="$emit('edit', course)"
        >
          编辑课程
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg border border-red-100 bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
          @click="$emit('delete', course)"
        >
          下架删除
        </button>
      </div>
    </div>
  </article>
</template>
