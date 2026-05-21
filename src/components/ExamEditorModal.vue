<script setup>
import { ref, watch } from 'vue'
import {
  createSingleChoiceQuestion,
  createBlankQuestion,
  createOptionId,
} from '../utils/examModel.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  lessonTitle: { type: String, default: '章节测验' },
})

const exam = defineModel('exam', { type: Object, required: true })

const emit = defineEmits(['close'])

const localExam = ref({ questions: [], summaryExplain: '' })

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && exam.value) {
      localExam.value = JSON.parse(JSON.stringify(exam.value))
      if (!localExam.value.questions) localExam.value.questions = []
    }
  }
)

function addQuestion(type) {
  const q =
    type === 'blank' ? createBlankQuestion() : createSingleChoiceQuestion()
  localExam.value.questions.push(q)
}

function removeQuestion(qIdx) {
  localExam.value.questions.splice(qIdx, 1)
}

function addOption(qIdx) {
  const q = localExam.value.questions[qIdx]
  if (q.type !== 'single') return
  q.options.push({ id: createOptionId(), text: `选项 ${q.options.length + 1}` })
}

function removeOption(qIdx, oIdx) {
  const q = localExam.value.questions[qIdx]
  if (q.options.length <= 2) return
  const removed = q.options[oIdx]
  q.options.splice(oIdx, 1)
  if (q.correctOptionId === removed.id) {
    q.correctOptionId = q.options[0]?.id ?? ''
  }
}

function handleSave() {
  const invalid = localExam.value.questions.find(
    (q) =>
      !q.stem.trim() ||
      (q.type === 'single' &&
        (!q.correctOptionId || q.options.some((o) => !o.text.trim()))) ||
      (q.type === 'blank' && !q.blankAnswer.trim())
  )
  if (invalid) {
    alert('请完善每道题的题干、选项/标准答案')
    return
  }
  exam.value = JSON.parse(JSON.stringify(localExam.value))
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[75] flex flex-col bg-[#f5f6f8]"
    >
      <header
        class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-8"
      >
        <button
          type="button"
          class="text-sm text-slate-500 hover:text-slate-800"
          @click="handleClose"
        >
          ← 返回大纲
        </button>
        <div class="text-center">
          <h2 class="font-bold text-slate-900">设计考试</h2>
          <p class="text-xs text-slate-500">{{ lessonTitle }}</p>
        </div>
        <button
          type="button"
          class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          @click="handleSave"
        >
          保存测验
        </button>
      </header>

      <div class="flex-1 overflow-y-auto">
        <div class="mx-auto max-w-2xl px-4 py-8">
          <div
            class="mb-6 flex flex-wrap gap-2 rounded-xl border border-violet-100 bg-violet-50/50 p-4"
          >
            <span class="w-full text-sm font-medium text-violet-800">添加题目</span>
            <button
              type="button"
              class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              @click="addQuestion('single')"
            >
              + 单项选择题
            </button>
            <button
              type="button"
              class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              @click="addQuestion('blank')"
            >
              + 填空题
            </button>
          </div>

          <div
            v-if="!localExam.questions.length"
            class="rounded-xl border border-dashed border-slate-200 py-16 text-center text-slate-400"
          >
            还没有题目，点击上方按钮添加
          </div>

          <div
            v-for="(q, qIdx) in localExam.questions"
            :key="q.id"
            class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="mb-4 flex items-center justify-between">
              <span
                class="rounded-md px-2 py-0.5 text-xs font-bold"
                :class="
                  q.type === 'single'
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-amber-100 text-amber-700'
                "
              >
                {{ q.type === 'single' ? '单选题' : '填空题' }}
              </span>
              <button
                type="button"
                class="text-xs text-red-500 hover:text-red-700"
                @click="removeQuestion(qIdx)"
              >
                删除此题
              </button>
            </div>

            <label class="mb-1 block text-sm font-medium text-slate-700">题干</label>
            <textarea
              v-model="q.stem"
              rows="2"
              placeholder="请输入题目描述…"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />

            <template v-if="q.type === 'single'">
              <p class="mb-2 mt-4 text-sm font-medium text-slate-700">
                选项（勾选正确答案）
              </p>
              <div
                v-for="(opt, oIdx) in q.options"
                :key="opt.id"
                class="mb-2 flex items-center gap-2"
              >
                <input
                  :id="`correct-${q.id}-${opt.id}`"
                  type="radio"
                  :name="`correct-${q.id}`"
                  :checked="q.correctOptionId === opt.id"
                  class="h-4 w-4 text-brand-600"
                  @change="q.correctOptionId = opt.id"
                />
                <input
                  v-model="opt.text"
                  type="text"
                  class="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="选项内容"
                />
                <button
                  v-if="q.options.length > 2"
                  type="button"
                  class="text-xs text-slate-400 hover:text-red-500"
                  @click="removeOption(qIdx, oIdx)"
                >
                  删
                </button>
              </div>
              <button
                type="button"
                class="mt-1 text-xs font-medium text-brand-600"
                @click="addOption(qIdx)"
              >
                + 添加选项
              </button>
            </template>

            <template v-else>
              <label class="mb-1 mt-4 block text-sm font-medium text-slate-700">
                标准答案关键词
              </label>
              <input
                v-model="q.blankAnswer"
                type="text"
                placeholder="学生答案包含此关键词即判对"
                class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </template>

            <label class="mb-1 mt-4 block text-sm font-medium text-slate-700">
              学长解析（答错时展示）
            </label>
            <textarea
              v-model="q.explanation"
              rows="2"
              placeholder="解析思路、易错点…"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-5">
            <label class="mb-1 block text-sm font-medium text-slate-700">
              测验结束语（学长解析总述）
            </label>
            <textarea
              v-model="localExam.summaryExplain"
              rows="2"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
