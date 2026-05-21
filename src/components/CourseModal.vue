<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useCommerce } from '../composables/useCommerce.js'
import { useCourseReviews } from '../composables/useCourseReviews.js'
import { useToast } from '../composables/useToast.js'
import { TRIAL_SECONDS } from '../utils/pricing.js'
import { parseBilibiliEmbed } from '../utils/coursePublish.js'
import StarRating from './StarRating.vue'
import CourseSyllabus from './CourseSyllabus.vue'
import CourseReviewsSection from './CourseReviewsSection.vue'
import StudentExamPanel from './StudentExamPanel.vue'

const props = defineProps({
  course: { type: Object, default: null },
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const { isLoggedIn, role, userKey, points, deductPoints } = useAuth()
const { isUnlocked, unlockCourse, recordCreatorSale } = useCommerce()
const { show: showToast } = useToast()

const courseIdRef = computed(() => props.course?.id ?? null)
const { ratingStats } = useCourseReviews(courseIdRef)

const trialPlaying = ref(false)
const trialEnded = ref(false)
const playerActive = ref(false)
const videoRef = ref(null)
let trialTimer = null

const unlocked = computed(() => {
  if (!props.course || !phone.value) return false
  return isUnlocked(phone.value, props.course.id)
})

const isFree = computed(() => props.course?.isFree ?? props.course?.price === 0)

const canWatchFull = computed(() => {
  if (!props.course) return false
  if (isFree.value) return true
  if (!isLoggedIn.value) return false
  if (role.value === 'creator') return true
  return unlocked.value
})

const canReview = computed(
  () =>
    isLoggedIn.value &&
    role.value === 'student' &&
    canWatchFull.value
)

const showPlayer = computed(
  () => playerActive.value && (canWatchFull.value || trialPlaying.value)
)

const needsUnlock = computed(
  () =>
    props.course &&
    !isFree.value &&
    isLoggedIn.value &&
    role.value === 'student' &&
    !unlocked.value
)

const pointsCost = computed(() => props.course?.pointsCost ?? 0)

const activeLesson = ref(null)

const activeLessonId = computed(() => activeLesson.value?.id ?? '')

const canAccessLesson = computed(() => {
  if (!activeLesson.value) return true
  return canWatchFull.value
})

const lessonVideoEmbed = computed(() => {
  const ls = activeLesson.value
  if (!ls || ls.contentType !== 'video') return ''
  if (ls.videoSource === 'bilibili') {
    const embed = parseBilibiliEmbed(ls.videoEmbed || ls.videoUrl)
    return embed ? `https:${embed}` : ''
  }
  return ls.videoUrl || ''
})

function onSelectLesson(lesson) {
  activeLesson.value = lesson
  resetPlaybackState()
  if (lesson.contentType === 'video' && canWatchFull.value) {
    playerActive.value = true
  }
}

function clearActiveLesson() {
  activeLesson.value = null
  resetPlaybackState()
}

function clearTrialTimer() {
  if (trialTimer) {
    clearTimeout(trialTimer)
    trialTimer = null
  }
}

function resetPlaybackState() {
  clearTrialTimer()
  trialPlaying.value = false
  trialEnded.value = false
  playerActive.value = false
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.currentTime = 0
  }
}

function startTrial() {
  if (canWatchFull.value) {
    playerActive.value = true
    return
  }
  trialEnded.value = false
  trialPlaying.value = true
  playerActive.value = true
  clearTrialTimer()
  trialTimer = setTimeout(() => endTrial(), TRIAL_SECONDS * 1000)
}

function endTrial() {
  clearTrialTimer()
  trialPlaying.value = false
  trialEnded.value = true
  playerActive.value = false
  if (videoRef.value) videoRef.value.pause()
}

function onVideoTimeUpdate(e) {
  if (canWatchFull.value) return
  if (e.target.currentTime >= TRIAL_SECONDS) endTrial()
}

function handleUnlock() {
  if (!isLoggedIn.value) {
    showToast('请先登录后再解锁课程', 'error')
    return
  }
  if (role.value !== 'student') {
    showToast('请切换到学生身份购买课程', 'error')
    return
  }
  const cost = pointsCost.value
  if (points.value < cost) {
    showToast('积分不足，请先充值', 'error')
    return
  }
  if (!deductPoints(cost)) {
    showToast('积分不足，请先充值', 'error')
    return
  }
  unlockCourse(userKey.value, props.course.id)
  recordCreatorSale(props.course.creatorId, cost)
  showToast('购买成功！', 'success')
  playerActive.value = true
  trialPlaying.value = false
  trialEnded.value = false
}

function handlePlayFull() {
  if (!canWatchFull.value && needsUnlock.value) {
    showToast('请先解锁完整课程', 'error')
    return
  }
  playerActive.value = true
  trialPlaying.value = false
  trialEnded.value = false
  clearTrialTimer()
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.open) emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (!isOpen) {
      resetPlaybackState()
      activeLesson.value = null
    } else if (canWatchFull.value && !activeLesson.value) {
      playerActive.value = true
    }
  }
)

watch(() => props.course?.id, () => {
  resetPlaybackState()
  activeLesson.value = null
})
watch(canWatchFull, (full) => {
  if (full && props.open) playerActive.value = true
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  resetPlaybackState()
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open && course"
        class="fixed inset-0 z-50 flex justify-center bg-slate-900/50 p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="`${course.title} 课程详情`"
      >
        <div class="absolute inset-0 backdrop-blur-sm" @click="emit('close')" />

        <div
          class="relative z-10 flex h-full w-full max-w-6xl flex-col overflow-hidden bg-slate-100 shadow-2xl sm:my-4 sm:max-h-[94vh] sm:rounded-2xl"
        >
          <!-- 顶栏关闭 -->
          <div
            class="absolute right-3 top-3 z-20 sm:right-4 sm:top-4"
          >
            <button
              type="button"
              class="rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition hover:bg-black/60"
              aria-label="关闭"
              @click="emit('close')"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto">
            <!-- Hero：大封面 + 标题 + 评分 -->
            <div class="relative bg-slate-900">
              <img
                :src="course.cover"
                :alt="course.title"
                class="h-48 w-full object-cover opacity-90 sm:h-56 md:h-64"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"
              />
              <div class="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-16 sm:px-8">
                <span
                  v-if="course.categoryLabel"
                  class="inline-block rounded-md bg-white/15 px-2 py-0.5 text-xs font-medium text-white/90"
                >
                  {{ course.categoryLabel }}
                </span>
                <h1 class="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {{ course.title }}
                </h1>
                <p class="mt-2 text-sm text-white/85">
                  讲师 IP：
                  <span class="font-semibold text-white">{{ course.instructor }}</span>
                </p>
                <div class="mt-3 flex flex-wrap items-center gap-3">
                  <div class="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                    <span class="text-lg font-bold text-amber-300">{{ ratingStats.average }}</span>
                    <StarRating
                      :model-value="ratingStats.stars"
                      readonly
                      size="sm"
                    />
                    <span class="text-sm text-white/80">
                      {{ ratingStats.count }} 条评价
                    </span>
                  </div>
                  <span
                    v-if="isFree"
                    class="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white"
                  >
                    {{ course.freeBadge || '免费' }}
                  </span>
                  <span
                    v-else
                    class="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white"
                  >
                    {{ course.priceLabel }} · {{ course.pointsCost }} 积分
                  </span>
                </div>
              </div>
            </div>

            <div class="mx-auto max-w-6xl px-4 py-6 sm:px-8">
              <div class="grid gap-8 lg:grid-cols-3">
                <!-- 主栏 -->
                <div class="space-y-8 lg:col-span-2">
                  <!-- 学习区：按选中小节切换 -->
                  <section
                    v-if="activeLesson"
                    class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div
                      class="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <p class="text-sm font-semibold text-slate-800">
                        正在学习：{{ activeLesson.title }}
                      </p>
                      <button
                        type="button"
                        class="text-xs text-brand-600 hover:underline"
                        @click="clearActiveLesson"
                      >
                        返回课程预览
                      </button>
                    </div>

                    <div v-if="!canAccessLesson" class="p-8 text-center">
                      <p class="text-slate-600">请先解锁课程后再学习本节内容</p>
                      <button
                        v-if="needsUnlock"
                        type="button"
                        class="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
                        @click="handleUnlock"
                      >
                        使用 {{ course.pointsCost }} 积分解锁
                      </button>
                    </div>

                    <StudentExamPanel
                      v-else-if="activeLesson.contentType === 'exam'"
                      :exam="activeLesson.exam"
                      :lesson-title="activeLesson.title"
                      :instructor="course.instructor"
                    />

                    <div
                      v-else-if="activeLesson.contentType === 'text'"
                      class="p-6"
                    >
                      <div
                        class="prose prose-sm max-w-none rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-slate-700"
                      >
                        <pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">{{
                          activeLesson.textContent || '暂无文字内容'
                        }}</pre>
                      </div>
                    </div>

                    <template v-else-if="activeLesson.contentType === 'video'">
                      <div class="relative aspect-video w-full bg-black">
                        <template v-if="showPlayer && lessonVideoEmbed">
                          <iframe
                            v-if="activeLesson.videoSource === 'bilibili'"
                            :src="lessonVideoEmbed"
                            class="h-full w-full"
                            frameborder="0"
                            allowfullscreen
                            title="小节视频"
                          />
                          <video
                            v-else
                            ref="videoRef"
                            class="h-full w-full"
                            controls
                            autoplay
                            :src="lessonVideoEmbed"
                            :poster="course.cover"
                            @timeupdate="onVideoTimeUpdate"
                          />
                        </template>
                        <template v-else>
                          <img
                            :src="course.cover"
                            class="h-full w-full object-cover opacity-50"
                            alt=""
                          />
                          <div
                            class="absolute inset-0 flex flex-col items-center justify-center gap-3"
                          >
                            <button
                              type="button"
                              class="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-600 shadow-lg"
                              @click="handlePlayFull"
                            >
                              <svg class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </button>
                            <p class="text-sm text-white">点击播放本节视频</p>
                          </div>
                        </template>
                      </div>
                    </template>
                  </section>

                  <!-- 默认：课程主视频预览 -->
                  <section
                    v-else
                    class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div class="relative aspect-video w-full bg-black">
                      <template v-if="showPlayer">
                        <iframe
                          v-if="course.videoType === 'bilibili'"
                          :src="'https:' + course.videoEmbed"
                          class="h-full w-full"
                          frameborder="0"
                          allowfullscreen
                          title="课程视频"
                        />
                        <video
                          v-else
                          ref="videoRef"
                          class="h-full w-full"
                          controls
                          autoplay
                          :src="course.videoUrl"
                          :poster="course.cover"
                          @timeupdate="onVideoTimeUpdate"
                        />
                      </template>
                      <template v-else>
                        <img
                          :src="course.cover"
                          class="h-full w-full object-cover opacity-50"
                          alt=""
                        />
                        <div
                          class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center"
                        >
                          <button
                            type="button"
                            class="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-600 shadow-xl transition hover:scale-105"
                            @click="isFree || canWatchFull ? handlePlayFull() : startTrial()"
                          >
                            <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                          <p class="text-sm font-medium text-white">
                            <template v-if="isFree">免费课程 · 点击完整观看</template>
                            <template v-else-if="needsUnlock">试看 10 秒或解锁后观看</template>
                            <template v-else>点击播放</template>
                          </p>
                          <p class="text-xs text-white/70">或从下方大纲选择小节</p>
                        </div>
                      </template>
                    </div>

                    <div
                      class="flex flex-wrap items-center gap-3 border-t border-slate-100 px-4 py-4 sm:px-5"
                    >
                      <button
                        v-if="needsUnlock"
                        type="button"
                        class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
                        @click="handleUnlock"
                      >
                        使用 {{ course.pointsCost }} 积分解锁课程
                      </button>
                      <button
                        v-else-if="isFree"
                        type="button"
                        class="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:from-emerald-600"
                        @click="handlePlayFull"
                      >
                        立即免费观看
                      </button>
                      <button
                        v-else-if="canWatchFull"
                        type="button"
                        class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                        @click="handlePlayFull"
                      >
                        立即播放
                      </button>
                      <button
                        v-else-if="!isFree"
                        type="button"
                        class="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        @click="startTrial"
                      >
                        试看 10 秒
                      </button>
                    </div>
                  </section>

                  <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                    <h3 class="text-lg font-bold text-slate-900">关于本课程</h3>
                    <p class="mt-3 text-sm leading-relaxed text-slate-600">
                      {{ course.description }}
                    </p>
                  </section>

                  <CourseSyllabus
                    :course="course"
                    :active-lesson-id="activeLessonId"
                    @select-lesson="onSelectLesson"
                  />

                  <CourseReviewsSection
                    :course-id="course.id"
                    :can-review="canReview"
                  />
                </div>

                <!-- 侧栏 -->
                <aside class="space-y-6 lg:col-span-1">
                  <div
                    class="sticky top-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <h3 class="text-sm font-bold text-slate-900">联系讲师</h3>
                    <p class="mt-1 text-xs text-slate-500">加微信 · 同辈答疑</p>
                    <img
                      :src="course.wechatQr"
                      alt="微信二维码"
                      class="mx-auto mt-4 h-40 w-40 rounded-xl border border-slate-100 p-1"
                    />
                    <p class="mt-3 text-center text-sm text-slate-600">
                      微信号
                      <code class="rounded bg-slate-100 px-2 py-0.5 font-mono text-brand-700">
                        {{ course.wechatId }}
                      </code>
                    </p>
                    <p
                      v-if="unlocked || isFree"
                      class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-700"
                    >
                      {{ isFree ? '已开放免费学习' : '已解锁 · 可评可练' }}
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
