<script setup>
import { ref, computed, watch } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useToast } from '../composables/useToast.js'
import { supabase } from '../supabase.js'
import { CATEGORIES } from '../data/categories.js'
import { readImageAsDataUrl } from '../utils/defaultAvatar.js'
import {
  buildCourseRowFromDraft,
  buildCourseUpdateRowFromDraft,
  appCourseToEditorDraft,
} from '../utils/courseMapper.js'
import { resolveCoverForPublish } from '../utils/coverUpload.js'
import {
  createChapter,
  createLesson,
} from '../utils/coursePublish.js'
import { createEmptyExam } from '../utils/examModel.js'
import ExamEditorModal from './ExamEditorModal.vue'

const props = defineProps({
  editCourse: { type: Object, default: null },
})

const emit = defineEmits(['published', 'updated', 'cancel'])

const { displayName, creatorProfileId, nickname, isLoggedIn, bindSupabase } = useAuth()
const { show: showToast } = useToast()

const publishableCategories = CATEGORIES.filter((c) => c.id !== 'all')

const cover = ref('')
const title = ref('')
const description = ref('')
const category = ref('education')
const pointsCost = ref(0)
const chapters = ref([{ ...createChapter(0), lessons: [createLesson()] }])

const coverLoading = ref(false)
const publishing = ref(false)
const publishPhase = ref('')
const showSuccess = ref(false)
const coverInputRef = ref(null)

const editingLesson = ref(null)
const lessonModalOpen = ref(false)
const examEditorOpen = ref(false)

const isEditMode = computed(() => Boolean(props.editCourse?.id))

const pageTitle = computed(() =>
  isEditMode.value ? '编辑课程' : '创建新课程'
)

const submitLabel = computed(() =>
  isEditMode.value ? '保存更新' : '正式发布课程'
)

const successTitle = computed(() =>
  isEditMode.value ? '更新成功！' : '发布成功！'
)

const successMessage = computed(() =>
  isEditMode.value
    ? '课程已同步至云端，同学们将看到最新内容。'
    : '您的课程已编入同辈课栈！'
)

function applyDraft(draft) {
  cover.value = draft.cover
  title.value = draft.title
  description.value = draft.description
  category.value = draft.category
  pointsCost.value = draft.pointsCost
  chapters.value = draft.chapters
}

function loadFromCourse(course) {
  if (!course) return
  applyDraft(appCourseToEditorDraft(course))
}

watch(
  () => props.editCourse,
  (c) => {
    if (c) loadFromCourse(c)
  },
  { immediate: true }
)

const contentTypes = [
  { id: 'video', label: '视频内容', icon: '🎬' },
  { id: 'text', label: '文字资料', icon: '📝' },
  { id: 'exam', label: '设计考试', icon: '✏️' },
]

const canPublish = computed(() => {
  if (!title.value.trim() || !category.value) return false
  if (!chapters.value.length) return false
  return chapters.value.some((ch) =>
    ch.lessons.some((ls) => ls.title.trim())
  )
})

function triggerCover() {
  coverInputRef.value?.click()
}

async function onCoverChange(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  coverLoading.value = true
  try {
    cover.value = await readImageAsDataUrl(file)
  } catch (err) {
    showToast(err.message || '封面上传失败', 'error')
  } finally {
    coverLoading.value = false
  }
}

function addChapter() {
  chapters.value.push(createChapter(chapters.value.length))
}

function removeChapter(cIdx) {
  if (chapters.value.length <= 1) {
    showToast('至少保留一个大章节', 'error')
    return
  }
  chapters.value.splice(cIdx, 1)
}

function addLesson(cIdx) {
  chapters.value[cIdx].lessons.push(createLesson())
}

function onContentTypeChange(lesson) {
  if (lesson.contentType === 'exam' && !lesson.exam) {
    lesson.exam = createEmptyExam()
  }
}

function removeLesson(cIdx, lIdx) {
  if (chapters.value[cIdx].lessons.length <= 1) {
    showToast('每章至少保留一个小节', 'error')
    return
  }
  chapters.value[cIdx].lessons.splice(lIdx, 1)
}

function openLessonEditor(cIdx, lIdx) {
  const lesson = chapters.value[cIdx].lessons[lIdx]
  editingLesson.value = { cIdx, lIdx }
  if (lesson.contentType === 'exam') {
    if (!lesson.exam) lesson.exam = createEmptyExam()
    examEditorOpen.value = true
    return
  }
  lessonModalOpen.value = true
}

function closeExamEditor() {
  examEditorOpen.value = false
  editingLesson.value = null
}

const editingLessonData = computed(() => {
  if (!editingLesson.value) return null
  return chapters.value[editingLesson.value.cIdx].lessons[editingLesson.value.lIdx]
})

const editingExam = computed({
  get() {
    return editingLessonData.value?.exam ?? createEmptyExam()
  },
  set(v) {
    if (editingLessonData.value) editingLessonData.value.exam = v
  },
})

function closeLessonModal() {
  lessonModalOpen.value = false
  editingLesson.value = null
}

function saveLessonModal() {
  closeLessonModal()
}

function onSuccessConfirm() {
  showSuccess.value = false
  if (isEditMode.value) emit('updated')
  else emit('published')
}

async function handleSubmit() {
  if (!canPublish.value) {
    showToast('请填写标题、分类，并至少完善一个小节', 'error')
    return
  }

  publishing.value = true
  publishPhase.value = '正在连接云端…'

  try {
    const user = await bindSupabase()
    if (!user?.id) {
      throw new Error('无法获取云端用户身份，请重新登录')
    }

    if (!isLoggedIn.value) {
      throw new Error('请先使用邮箱密码登录后再发布')
    }

    publishPhase.value = '正在处理封面…'
    const coverUrl = await resolveCoverForPublish(cover.value, user.id)

    const draft = {
      cover: coverUrl,
      title: title.value,
      description: description.value,
      category: category.value,
      pointsCost: pointsCost.value,
      chapters: chapters.value,
    }

    if (isEditMode.value) {
      publishPhase.value = '正在更新课程…'
      const row = buildCourseUpdateRowFromDraft(draft, {
        nickname: nickname.value,
        creatorProfileId: creatorProfileId.value,
      })
      const { error } = await supabase
        .from('courses')
        .update(row)
        .eq('id', props.editCourse.id)
      if (error) throw error
      publishPhase.value = '更新成功！'
      showToast('课程已更新并同步至云端', 'success')
    } else {
      publishPhase.value = '正在写入课程数据…'
      const row = buildCourseRowFromDraft(draft, {
        userId: user.id,
        nickname: nickname.value,
        creatorProfileId: creatorProfileId.value,
      })
      const { error } = await supabase.from('courses').insert(row)
      if (error) throw error
      publishPhase.value = '发布成功！'
    }
    await new Promise((r) => setTimeout(r, 400))
    showSuccess.value = true
  } catch (err) {
    console.error('[publish]', err)
    const raw = err?.message || err?.error_description || String(err)
    let msg = raw || '发布失败，请稍后重试'
    if (raw.toLowerCase().includes('rate limit')) {
      msg =
        '云端注册邮件太频繁（Supabase 限额）。请等约 1 小时，或在 Supabase → Authentication → Providers 开启「Anonymous sign-ins」后刷新再发布'
    } else if (raw.toLowerCase().includes('invalid path')) {
      msg =
        'Supabase 地址配置有误：.env.local 的 VITE_SUPABASE_URL 应为 https://xxx.supabase.co（不要带 /rest/v1/），改完后重启 npm run dev'
    } else if (raw.includes('JWT') || raw.includes('policy') || raw.includes('RLS')) {
      msg = `${raw}（请确认已选创作者身份并完成登录）`
    }
    showToast(msg, 'error')
  } finally {
    publishing.value = false
    publishPhase.value = ''
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[45] flex flex-col bg-[#f5f6f8]">
    <header
      class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-8"
    >
      <button
        type="button"
        class="text-sm font-medium text-slate-500 hover:text-slate-800"
        :disabled="publishing"
        @click="emit('cancel')"
      >
        ← 返回
      </button>
      <h1 class="text-base font-bold text-slate-900 sm:text-lg">{{ pageTitle }}</h1>
      <div class="w-20" />
    </header>

    <div class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p class="mb-8 text-center text-sm text-slate-500">
          {{ isEditMode ? '修改后将覆盖云端数据' : '问卷星式两步发布' }} · {{ displayName }}
        </p>

        <section class="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-6 flex items-center gap-2">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700"
            >1</span>
            <h2 class="text-lg font-bold text-slate-900">基础信息</h2>
          </div>

          <div class="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
            <button
              type="button"
              class="group relative h-36 w-56 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50"
              @click="triggerCover"
            >
              <img
                v-if="cover"
                :src="cover"
                alt="封面预览"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full flex-col items-center justify-center text-slate-400"
              >
                <span class="text-3xl">🖼️</span>
                <span class="mt-2 text-xs">{{ coverLoading ? '处理中…' : '上传封面' }}</span>
              </div>
              <span
                class="absolute inset-0 flex items-center justify-center bg-black/0 text-xs text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100"
              >
                更换封面
              </span>
            </button>
            <input
              ref="coverInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onCoverChange"
            />
            <div class="mt-4 min-w-0 flex-1 sm:mt-0">
              <label class="mb-1.5 block text-sm font-medium text-slate-700">课程标题</label>
              <input
                v-model="title"
                type="text"
                placeholder="例如：从0到1：小红书爆款博主修炼指南"
                class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <label class="mb-1.5 mt-4 block text-sm font-medium text-slate-700">简介</label>
              <textarea
                v-model="description"
                rows="3"
                placeholder="用一两句话介绍课程亮点…"
                class="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">所属模块</label>
              <select
                v-model="category"
                class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option
                  v-for="cat in publishableCategories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">
                积分价格（0 = 免费，自动打免费标签）
              </label>
              <input
                v-model.number="pointsCost"
                type="number"
                min="0"
                step="1"
                placeholder="如 99 积分 ≈ 9.9 元"
                class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <p class="mt-1 text-xs text-slate-400">1 元 = 10 积分</p>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-700"
              >2</span>
              <h2 class="text-lg font-bold text-slate-900">自由编写大纲</h2>
            </div>
            <button
              type="button"
              class="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
              @click="addChapter"
            >
              + 添加大章节
            </button>
          </div>

          <div class="space-y-4">
            <div
              v-for="(chapter, cIdx) in chapters"
              :key="chapter.id"
              class="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
            >
              <div class="flex gap-2">
                <input
                  v-model="chapter.title"
                  type="text"
                  placeholder="第一章：短视频小白入门"
                  class="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  class="shrink-0 text-xs text-red-500 hover:text-red-700"
                  @click="removeChapter(cIdx)"
                >
                  删除章
                </button>
              </div>

              <ul class="mt-3 space-y-2">
                <li
                  v-for="(lesson, lIdx) in chapter.lessons"
                  :key="lesson.id"
                  class="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <input
                    v-model="lesson.title"
                    type="text"
                    placeholder="第一节：小节标题"
                    class="min-w-[140px] flex-1 rounded-lg border border-slate-100 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <input
                    v-model.number="lesson.durationMin"
                    type="number"
                    min="1"
                    class="w-16 rounded-lg border border-slate-100 px-2 py-1.5 text-center text-xs"
                    title="分钟"
                  />
                  <span class="text-xs text-slate-400">分钟</span>
                  <select
                    v-model="lesson.contentType"
                    class="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs font-medium"
                    @change="onContentTypeChange(lesson)"
                  >
                    <option
                      v-for="t in contentTypes"
                      :key="t.id"
                      :value="t.id"
                    >
                      {{ t.icon }} {{ t.label }}
                    </option>
                  </select>
                  <button
                    type="button"
                    class="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                    @click="openLessonEditor(cIdx, lIdx)"
                  >
                    {{ lesson.contentType === 'exam' ? '设计考试' : '编辑内容' }}
                  </button>
                  <button
                    type="button"
                    class="text-xs text-slate-400 hover:text-red-500"
                    @click="removeLesson(cIdx, lIdx)"
                  >
                    删除
                  </button>
                </li>
              </ul>

              <button
                type="button"
                class="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700"
                @click="addLesson(cIdx)"
              >
                + 添加小节
              </button>
            </div>
          </div>
        </section>

        <div class="mt-8 flex justify-center pb-12">
          <button
            type="button"
            class="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-12 py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
            :disabled="!canPublish || publishing"
            @click="handleSubmit"
          >
            {{ publishing ? (isEditMode ? '保存中…' : '发布中…') : submitLabel }}
          </button>
        </div>
      </div>
    </div>

    <!-- 发布中全屏动画 -->
    <Teleport to="body">
      <div
        v-if="publishing"
        class="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md"
      >
        <div class="relative">
          <div
            class="h-20 w-20 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"
          />
          <div
            class="absolute inset-0 flex items-center justify-center text-2xl"
          >
            🚀
          </div>
        </div>
        <p class="mt-6 text-lg font-semibold text-white">{{ publishPhase }}</p>
        <p class="mt-2 text-sm text-violet-200">同辈课栈 · 云端同步中</p>
      </div>

      <!-- 发布成功 -->
      <div
        v-if="showSuccess"
        class="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl"
          >
            ✓
          </div>
          <h3 class="text-xl font-bold text-slate-900">{{ successTitle }}</h3>
          <p class="mt-2 text-slate-600">{{ successMessage }}</p>
          <button
            type="button"
            class="mt-6 w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700"
            @click="onSuccessConfirm"
          >
            {{ isEditMode ? '返回课程管理' : '返回首页' }}
          </button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="lessonModalOpen && editingLessonData"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        @click.self="closeLessonModal"
      >
        <div
          class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          @click.stop
        >
          <h3 class="text-lg font-bold text-slate-900">
            {{ editingLessonData.contentType === 'video' ? '视频内容' : '文字资料' }}
          </h3>

          <template v-if="editingLessonData.contentType === 'video'">
            <label class="mb-1.5 mt-4 block text-sm font-medium text-slate-700">
              视频嵌入链接（B 站 BV 号或完整嵌入地址）
            </label>
            <input
              v-model="editingLessonData.videoEmbed"
              type="text"
              placeholder="如 BV1GJ411x7h7 或 //player.bilibili.com/..."
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <p class="mt-2 text-xs text-slate-400">也支持填写云存储直链，将写入课程 JSON</p>
          </template>

          <template v-else-if="editingLessonData.contentType === 'text'">
            <label class="mb-1.5 mt-4 block text-sm font-medium text-slate-700">
              图文教程正文
            </label>
            <textarea
              v-model="editingLessonData.textContent"
              rows="14"
              placeholder="在此编写讲义、步骤、配图说明（支持换行与简单排版）…"
              class="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </template>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              @click="closeLessonModal"
            >
              取消
            </button>
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              @click="saveLessonModal"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <ExamEditorModal
      v-model:exam="editingExam"
      :open="examEditorOpen"
      :lesson-title="editingLessonData?.title || '章节测验'"
      @close="closeExamEditor"
    />
  </div>
</template>
