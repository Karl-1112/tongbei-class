<script setup>
import CourseCard from './CourseCard.vue'

defineProps({
  courses: {
    type: Array,
    required: true,
  },
})

defineEmits(['select'])
</script>

<template>
  <section
    class="mb-10 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 p-4 shadow-sm sm:p-5"
    aria-label="今日免费精选"
  >
    <div class="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-slate-900 sm:text-xl">
          🔥 零门槛破局 · 今日免费精选
        </h2>
        <p class="mt-0.5 text-xs text-slate-500 sm:text-sm">
          全站高热免费课 · 点开即看 · 帮你快速建立信任
        </p>
      </div>
      <span
        class="hidden shrink-0 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white sm:inline-block"
      >
        {{ courses.length }} 门精选
      </span>
    </div>

    <div
      class="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div
        v-for="course in courses"
        :key="'featured-' + course.id"
        class="w-[min(85vw,280px)] shrink-0 snap-start sm:w-[300px]"
      >
        <CourseCard :course="course" compact @select="$emit('select', $event)" />
      </div>
    </div>
  </section>
</template>
