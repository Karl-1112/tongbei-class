<script setup>
import { ref, computed } from 'vue'
import { getSyllabusForCourse } from '../data/courseSyllabus.js'

const props = defineProps({
  course: { type: Object, required: true },
  activeLessonId: { type: String, default: '' },
})

const emit = defineEmits(['select-lesson'])

const expanded = ref(true)
const openChapters = ref([0])

const syllabus = computed(() => getSyllabusForCourse(props.course))

function toggleChapter(index) {
  const i = openChapters.value.indexOf(index)
  if (i >= 0) openChapters.value = openChapters.value.filter((x) => x !== index)
  else openChapters.value = [...openChapters.value, index]
}

function isChapterOpen(index) {
  return openChapters.value.includes(index)
}

function contentIcon(type) {
  if (type === 'video') return '🎬'
  if (type === 'text') return '📝'
  if (type === 'exam') return '✏️'
  return '📄'
}

function onLessonClick(lesson) {
  emit('select-lesson', lesson.rawLesson)
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white">
    <button
      type="button"
      class="flex w-full items-center justify-between px-5 py-4 text-left"
      @click="expanded = !expanded"
    >
      <div>
        <h3 class="text-lg font-bold text-slate-900">课程大纲</h3>
        <p class="mt-0.5 text-sm text-slate-500">
          共 {{ syllabus.chapterCount }} 个章节 · {{ syllabus.lessonCount }} 小节 · 总计
          {{ syllabus.totalMinutes }} 分钟 · 点击小节进入学习
        </p>
      </div>
      <svg
        class="h-5 w-5 shrink-0 text-slate-400 transition"
        :class="expanded && 'rotate-180'"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-show="expanded" class="border-t border-slate-100 px-5 pb-4">
      <div
        v-for="(chapter, cIdx) in syllabus.chapters"
        :key="cIdx"
        class="mt-3 overflow-hidden rounded-xl border border-slate-100"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
          @click="toggleChapter(cIdx)"
        >
          <span class="font-semibold text-slate-800">{{ chapter.title }}</span>
          <span class="text-xs text-slate-400">
            {{ chapter.lessons.length }} 节
            <svg
              class="ml-1 inline h-4 w-4 transition"
              :class="isChapterOpen(cIdx) && 'rotate-180'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        <ul v-show="isChapterOpen(cIdx)" class="divide-y divide-slate-50 bg-white">
          <li
            v-for="(lesson, lIdx) in chapter.lessons"
            :key="lesson.id || lIdx"
          >
            <button
              type="button"
              class="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-brand-50/50"
              :class="
                activeLessonId === lesson.id
                  ? 'bg-brand-50 ring-1 ring-inset ring-brand-200'
                  : ''
              "
              @click="onLessonClick(lesson)"
            >
              <span
                class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                :class="
                  lesson.contentType === 'exam'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-brand-100 text-brand-700'
                "
              >
                {{ contentIcon(lesson.contentType) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-slate-800">{{ lesson.title }}</p>
                <p class="mt-0.5 text-xs text-slate-400">
                  {{ lesson.durationMin }} 分钟
                  <span v-if="lesson.contentType === 'exam'" class="text-violet-600">
                    · 点击答题
                  </span>
                  <span v-else-if="lesson.contentType === 'text'" class="text-brand-600">
                    · 阅读讲义
                  </span>
                  <span v-else class="text-brand-600"> · 观看视频</span>
                </p>
              </div>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
