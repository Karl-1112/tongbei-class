import { ref, computed } from 'vue'
import { getSeedReviews, getReviewMeta } from '../data/courseReviewsSeed.js'

const STORAGE_KEY = 'peer-course-user-reviews'

function loadUserReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return {}
}

const userReviewsByCourse = ref(loadUserReviews())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userReviewsByCourse.value))
}

function maskPhone(phone) {
  if (!phone || phone.length < 11) return '匿名学员'
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

function formatReviewDate(iso) {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function useCourseReviews(courseIdRef) {
  const reviewsForCourse = computed(() => {
    const courseId = courseIdRef.value
    if (!courseId) return []
    const seeds = getSeedReviews(courseId)
    const userList = userReviewsByCourse.value[courseId] ?? []
    return [...userList, ...seeds].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
  })

  const ratingStats = computed(() => {
    const courseId = courseIdRef.value
    if (!courseId) return { average: '0.0', count: 0, stars: 0 }
    const meta = getReviewMeta(courseId)
    const list = reviewsForCourse.value
    const baseline = meta.baselineCount ?? 0
    const baseRating = meta.baselineRating ?? 4.5

    const totalCount = baseline + list.length
    const ratingSum =
      baseline * baseRating + list.reduce((s, r) => s + r.rating, 0)
    const average = totalCount > 0 ? ratingSum / totalCount : baseRating

    return {
      average: average.toFixed(1),
      count: totalCount,
      stars: Math.round(average),
    }
  })

  function addReview(courseId, { phone, nickname, avatar, rating, content }) {
    const entry = {
      id: `user_${Date.now()}`,
      authorLabel: nickname?.trim() || maskPhone(phone),
      phoneMask: maskPhone(phone),
      avatar: avatar || '',
      rating,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      isSeed: false,
    }
    const prev = userReviewsByCourse.value[courseId] ?? []
    userReviewsByCourse.value = {
      ...userReviewsByCourse.value,
      [courseId]: [entry, ...prev],
    }
    persist()
    return entry
  }

  return {
    reviewsForCourse,
    ratingStats,
    addReview,
    formatReviewDate,
    maskPhone,
  }
}
