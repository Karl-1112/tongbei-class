/** 1 元 = 10 积分 */
export const POINTS_PER_YUAN = 10

export const DEFAULT_STUDENT_POINTS = 500

export const TRIAL_SECONDS = 10

/** 演示用：切换到创作者身份时绑定的讲师账号（对应「小林学姐」的课程） */
export const DEMO_CREATOR_ID = 'creator_xiaolin'

export function priceToPoints(priceYuan) {
  if (!priceYuan || priceYuan <= 0) return 0
  return Math.round(priceYuan * POINTS_PER_YUAN)
}

export function pointsToYuan(points) {
  return (points / POINTS_PER_YUAN).toFixed(1)
}
