/** 各课程预设评价（新课程默认无种子评论） */
export const REVIEW_META = {
  default: { baselineRating: 4.8, baselineCount: 0 },
}

export const SEED_REVIEWS_BY_COURSE = {}

export function getReviewMeta(courseId) {
  return REVIEW_META[courseId] ?? REVIEW_META.default
}

export function getSeedReviews(courseId) {
  return SEED_REVIEWS_BY_COURSE[courseId] ?? []
}
