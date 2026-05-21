<script setup>
import { ref, computed, toRef } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useCourseReviews } from '../composables/useCourseReviews.js'
import { useToast } from '../composables/useToast.js'
import StarRating from './StarRating.vue'
import UserAvatar from './UserAvatar.vue'
import { DEFAULT_AVATAR_SVG } from '../utils/defaultAvatar.js'

const props = defineProps({
  courseId: { type: Number, required: true },
  canReview: { type: Boolean, default: false },
})

const { userKey, nickname, displayAvatar } = useAuth()
const { show: showToast } = useToast()

const courseIdRef = toRef(props, 'courseId')
const { reviewsForCourse, addReview, formatReviewDate } = useCourseReviews(courseIdRef)

const draftRating = ref(0)
const draftText = ref('')
const submitting = ref(false)

const canSubmit = computed(
  () => draftRating.value >= 1 && draftText.value.trim().length >= 2 && !submitting.value
)

async function handleSubmit() {
  if (!props.canReview) {
    showToast('解锁课程后才能发表评价', 'error')
    return
  }
  if (!canSubmit.value) return

  submitting.value = true
  await new Promise((r) => setTimeout(r, 1000))

  addReview(props.courseId, {
    phone: userKey.value,
    nickname: nickname.value,
    avatar: displayAvatar.value,
    rating: draftRating.value,
    content: draftText.value,
  })

  submitting.value = false
  draftRating.value = 0
  draftText.value = ''
  showToast('评价已发表，感谢你的反馈！', 'success')
}
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <h3 class="text-lg font-bold text-slate-900">学员真实评价</h3>
    <p class="mt-1 text-sm text-slate-500">
      {{ reviewsForCourse.length }} 条精选展示 · 综合口碑来自真实同辈
    </p>

    <!-- 写评价（仅已解锁） -->
    <div
      v-if="canReview"
      class="mt-6 rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-slate-50 p-4 sm:p-5"
    >
      <h4 class="text-sm font-semibold text-slate-900">写评价</h4>
      <p class="mt-1 text-xs text-slate-500">你的评分将帮助更多同辈选课排雷</p>

      <div class="mt-4">
        <p class="mb-2 text-xs font-medium text-slate-600">课程评分</p>
        <StarRating v-model="draftRating" size="lg" />
        <p v-if="draftRating" class="mt-1 text-xs text-amber-600">
          已选 {{ draftRating }} 星
        </p>
      </div>

      <textarea
        v-model="draftText"
        rows="3"
        placeholder="写下你的学习心得，帮同辈们排雷..."
        class="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />

      <button
        type="button"
        class="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中…' : '发表评论' }}
      </button>
    </div>

    <p
      v-else
      class="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500"
    >
      解锁或购买本课程后，即可发表评价与评分。
    </p>

    <!-- 评论列表 -->
    <ul class="mt-6 space-y-4">
      <li
        v-for="review in reviewsForCourse"
        :key="review.id"
        class="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
      >
        <div class="flex items-start gap-3">
          <UserAvatar
            :src="review.avatar || (review.isSeed ? '' : DEFAULT_AVATAR_SVG)"
            :name="review.authorLabel"
            size="sm"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold text-slate-900">
                {{ review.authorLabel || review.phoneMask }}
              </span>
              <span
                v-if="!review.isSeed"
                class="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600"
              >
                我的评价
              </span>
            </div>
            <div class="mt-1 flex items-center gap-2">
              <StarRating :model-value="review.rating" readonly size="sm" />
              <span class="text-xs text-slate-400">
                {{ formatReviewDate(review.createdAt) }}
              </span>
            </div>
            <p class="mt-2 text-sm leading-relaxed text-slate-700">
              {{ review.content }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
