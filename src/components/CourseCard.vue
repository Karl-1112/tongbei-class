<script setup>
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useCommerce } from '../composables/useCommerce.js'

const props = defineProps({
  course: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])

const { userKey, isLoggedIn, role } = useAuth()
const { isUnlocked } = useCommerce()

const purchased = computed(() => {
  if (!isLoggedIn.value || role.value !== 'student') return false
  return isUnlocked(userKey.value, props.course.id)
})

const freeBadgeClass = computed(() =>
  props.course.freeBadge === '公益'
    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 shadow-teal-500/30'
    : 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/30'
)
</script>

<template>
  <article
    role="button"
    tabindex="0"
    class="group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
    :class="
      course.isFree
        ? 'border-emerald-200/90 hover:border-emerald-300 hover:shadow-emerald-500/10'
        : 'border-slate-200/80 hover:border-brand-200 hover:shadow-brand-500/10'
    "
    @click="$emit('select', course)"
    @keydown.enter="$emit('select', course)"
    @keydown.space.prevent="$emit('select', course)"
  >
    <div class="relative aspect-video overflow-hidden bg-slate-100">
      <img
        :src="course.cover"
        :alt="course.title"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        loading="lazy"
      />

      <!-- 免费 / 公益 主标签 -->
      <span
        v-if="course.isFree"
        class="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow-md ring-2 ring-white/50"
        :class="freeBadgeClass"
      >
        <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        {{ course.freeBadge || '免费' }}
      </span>

      <!-- 付费价格 -->
      <span
        v-else
        class="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-700 shadow-sm"
      >
        {{ course.priceLabel }}
      </span>

      <span
        v-if="purchased && !course.isFree"
        class="absolute left-3 top-3 rounded-full bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
      >
        已解锁
      </span>

      <div
        class="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20"
      >
        <span
          class="flex items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-lg transition group-hover:scale-100"
          :class="compact ? 'h-10 w-10 scale-90' : 'h-12 w-12 scale-0 group-hover:scale-100'"
        >
          <svg
            class="fill-current"
            :class="compact ? 'h-5 w-5' : 'h-6 w-6'"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    </div>

    <div :class="compact ? 'p-3' : 'p-4'">
      <h3
        class="line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700"
        :class="compact ? 'text-sm' : 'text-base'"
      >
        <span
          v-if="course.isFree && !compact"
          class="mr-1.5 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700"
        >
          {{ course.freeBadge }}
        </span>
        {{ course.title }}
      </h3>
      <p
        class="mt-2 flex items-center gap-2 text-slate-500"
        :class="compact ? 'text-xs' : 'text-sm'"
      >
        <span
          class="inline-flex items-center justify-center rounded-full bg-brand-100 font-medium text-brand-700"
          :class="compact ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs'"
        >
          {{ course.instructor.charAt(0) }}
        </span>
        {{ course.instructor }}
      </p>
      <p
        class="mt-1 flex flex-wrap items-center gap-2 text-slate-400"
        :class="compact ? 'text-[10px]' : 'text-xs'"
      >
        <span class="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-500">
          {{ course.categoryLabel }}
        </span>
        <span v-if="course.isFree" class="font-medium text-emerald-600">零积分 · 完整观看</span>
        <span v-else>{{ course.pointsCost }} 积分解锁</span>
      </p>
    </div>
  </article>
</template>
