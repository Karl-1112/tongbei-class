<script setup>
import { ref, computed } from 'vue'
import { gradeExam } from '../utils/examModel.js'

const props = defineProps({
  exam: { type: Object, required: true },
  lessonTitle: { type: String, default: '章节测验' },
  instructor: { type: String, default: '学长' },
})

const answers = ref({})
const submitted = ref(false)
const result = ref(null)

const questions = computed(() => props.exam?.questions ?? [])

const canSubmit = computed(() => {
  if (!questions.value.length) return false
  return questions.value.every((q) => {
    const a = answers.value[q.id]
    if (q.type === 'single') return Boolean(a)
    return String(a ?? '').trim().length > 0
  })
})

function setSingleAnswer(qId, optionId) {
  answers.value = { ...answers.value, [qId]: optionId }
}

function handleSubmit() {
  if (!canSubmit.value) return
  result.value = gradeExam(props.exam, answers.value)
  submitted.value = true
}

function retry() {
  answers.value = {}
  submitted.value = false
  result.value = null
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
    <div class="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 px-5 py-4">
      <div class="flex items-center gap-2">
        <span class="text-2xl">✏️</span>
        <div>
          <h3 class="font-bold text-slate-900">{{ lessonTitle }}</h3>
          <p class="text-xs text-slate-500">章节测验 · 共 {{ questions.length }} 题</p>
        </div>
      </div>
    </div>

    <div v-if="!questions.length" class="p-8 text-center text-slate-500">
      创作者尚未配置题目
    </div>

    <div v-else class="p-5 sm:p-6">
      <!-- 成绩页 -->
      <div
        v-if="submitted && result"
        class="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center"
      >
        <p class="text-sm text-slate-600">测验得分</p>
        <p class="mt-1 text-5xl font-bold text-emerald-600">{{ result.score }}</p>
        <p class="text-sm text-slate-500">
          答对 {{ result.correctCount }} / {{ result.total }} 题
        </p>
        <p class="mt-4 rounded-lg bg-white/80 px-4 py-3 text-left text-sm leading-relaxed text-slate-700">
          <span class="font-semibold text-violet-700">学长解析：</span>
          {{ exam.summaryExplain || `${instructor}建议你回顾错题，巩固后再练一次。` }}
        </p>
        <button
          type="button"
          class="mt-4 rounded-xl border border-violet-200 bg-white px-5 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50"
          @click="retry"
        >
          重新作答
        </button>
      </div>

      <!-- 题目列表 -->
      <div class="space-y-6">
        <div
          v-for="(q, idx) in questions"
          :key="q.id"
          class="rounded-xl border p-4 transition"
          :class="
            submitted && result
              ? result.details.find((d) => d.questionId === q.id)?.correct
                ? 'border-emerald-200 bg-emerald-50/30'
                : 'border-red-200 bg-red-50/30'
              : 'border-slate-100 bg-slate-50/50'
          "
        >
          <p class="mb-3 font-medium text-slate-900">
            <span class="mr-2 text-brand-600">{{ idx + 1 }}.</span>
            {{ q.stem }}
            <span
              v-if="submitted && result"
              class="ml-2 text-xs font-bold"
              :class="
                result.details.find((d) => d.questionId === q.id)?.correct
                  ? 'text-emerald-600'
                  : 'text-red-600'
              "
            >
              {{
                result.details.find((d) => d.questionId === q.id)?.correct
                  ? '✓ 正确'
                  : '✗ 错误'
              }}
            </span>
          </p>

          <template v-if="q.type === 'single'">
            <label
              v-for="opt in q.options"
              :key="opt.id"
              class="mb-2 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-brand-300"
              :class="
                answers[q.id] === opt.id && !submitted && 'border-brand-500 ring-1 ring-brand-500/30'
              "
            >
              <input
                type="radio"
                :name="`ans-${q.id}`"
                :checked="answers[q.id] === opt.id"
                :disabled="submitted"
                class="h-4 w-4 text-brand-600"
                @change="setSingleAnswer(q.id, opt.id)"
              />
              <span class="text-sm text-slate-800">{{ opt.text }}</span>
            </label>
          </template>

          <template v-else>
            <input
              v-model="answers[q.id]"
              type="text"
              :disabled="submitted"
              placeholder="请输入答案"
              class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm disabled:bg-slate-50"
            />
          </template>

          <div
            v-if="submitted && result && !result.details.find((d) => d.questionId === q.id)?.correct"
            class="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-red-100"
          >
            <span class="font-semibold text-violet-700">学长解析：</span>
            {{ q.explanation || '暂无解析，建议回看本章内容。' }}
            <template v-if="q.type === 'blank' && q.blankAnswer">
              <span class="mt-1 block text-xs text-slate-400">
                参考答案：{{ q.blankAnswer }}
              </span>
            </template>
          </div>
        </div>
      </div>

      <button
        v-if="!submitted"
        type="button"
        class="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-base font-semibold text-white shadow-lg disabled:opacity-50"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        提交答卷
      </button>
    </div>
  </section>
</template>
