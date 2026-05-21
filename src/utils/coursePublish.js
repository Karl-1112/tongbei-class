import { CATEGORIES } from '../data/categories.js'
import { priceToPoints, POINTS_PER_YUAN } from './pricing.js'
import { createEmptyExam } from './examModel.js'

export function createChapter(index = 0) {
  return {
    id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: `第${index + 1}章：`,
    lessons: [],
  }
}

export function createLesson() {
  return {
    id: `ls_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: '',
    durationMin: 10,
    contentType: 'video',
    videoSource: 'bilibili',
    videoEmbed: '',
    videoUrl: '',
    localVideoName: '',
    textContent: '',
    exam: createEmptyExam(),
  }
}

/** 将 B 站链接转为播放器 embed 路径 */
export function parseBilibiliEmbed(input) {
  const s = (input || '').trim()
  if (!s) return ''
  if (s.startsWith('//player.bilibili.com')) return s
  const bv = s.match(/BV[\w]+/i)?.[0]
  if (bv) {
    return `//player.bilibili.com/player.html?bvid=${bv}&page=1&high_quality=1&danmaku=0`
  }
  if (s.includes('player.bilibili.com')) {
    return s.startsWith('http') ? s.replace(/^https?:/, '') : s
  }
  return s
}

export function buildCourseFromDraft(draft, auth) {
  const category = draft.category
  const catMeta = CATEGORIES.find((c) => c.id === category)
  const pointsCost = Number(draft.pointsCost) || 0
  const isFree = pointsCost === 0
  const priceYuan = isFree ? 0 : pointsCost / POINTS_PER_YUAN

  const chapters = draft.chapters.map((ch) => ({
    ...ch,
    lessons: ch.lessons.map((ls) => ({
      ...ls,
      videoEmbed:
        ls.contentType === 'video' && ls.videoSource === 'bilibili'
          ? parseBilibiliEmbed(ls.videoEmbed || ls.videoUrl)
          : ls.videoEmbed,
    })),
  }))

  const firstVideo = chapters
    .flatMap((ch) => ch.lessons)
    .find((ls) => ls.contentType === 'video' && ls.videoEmbed)

  const id = Date.now()
  const instructor = auth.nickname || '同辈学长'
  const creatorId = auth.creatorProfileId || `creator_${id}`

  return {
    id,
    title: draft.title.trim(),
    instructor,
    creatorId,
    category,
    categoryLabel: catMeta?.label ?? '未分类',
    price: priceYuan,
    priceLabel: isFree ? '免费' : `${priceYuan.toFixed(1)}元`,
    pointsCost,
    isFree,
    freeBadge: isFree ? '免费' : null,
    featuredScore: 0,
    cover: draft.cover || '',
    description: draft.description?.trim() || '由同辈学长精心打磨，欢迎学习。',
    videoType: firstVideo ? 'bilibili' : 'placeholder',
    videoEmbed: firstVideo?.videoEmbed || '',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    wechatId: `creator_${String(id).slice(-6)}`,
    wechatQr: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=creator_${id}`,
    syllabus: { chapters },
    createdAt: Date.now(),
  }
}
