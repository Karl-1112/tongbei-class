import { CATEGORIES } from '../data/categories.js'
import { priceToPoints, POINTS_PER_YUAN } from './pricing.js'
import { parseBilibiliEmbed, createChapter, createLesson } from './coursePublish.js'
import { createEmptyExam } from './examModel.js'

/** 数据库行 → 前端课程对象 */
export function mapDbCourseToApp(row) {
  const cat = CATEGORIES.find((x) => x.id === row.category)
  const pointsCost = row.points_cost ?? priceToPoints(Number(row.price_yuan) || 0)
  const isFree = row.is_free ?? pointsCost === 0

  return {
    id: row.id,
    title: row.title,
    instructor: row.instructor || '同辈学长',
    creatorId: row.creator_id,
    category: row.category,
    categoryLabel: row.category_label ?? cat?.label ?? '未分类',
    price: Number(row.price_yuan) || 0,
    priceLabel: isFree ? '免费' : `${Number(row.price_yuan).toFixed(1)}元`,
    pointsCost,
    isFree,
    freeBadge: isFree ? '免费' : null,
    featuredScore: row.featured_score ?? 0,
    cover: row.cover_url || '',
    description: row.description || '',
    videoType: row.video_type || 'placeholder',
    videoEmbed: row.video_embed || '',
    videoUrl: row.video_url || '',
    wechatId: row.wechat_id || '',
    wechatQr: row.wechat_qr || '',
    syllabus: row.syllabus ?? { chapters: [] },
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  }
}

/** 云端课程 → 编辑器草稿（原样回填大纲 JSON） */
export function appCourseToEditorDraft(course) {
  const syllabus = course.syllabus || { chapters: [] }
  let chapters = (syllabus.chapters || []).map((ch) => ({
    ...ch,
    lessons: (ch.lessons || []).map((ls) => ({
      ...ls,
      exam: ls.exam ? structuredClone(ls.exam) : createEmptyExam(),
    })),
  }))

  if (!chapters.length) {
    chapters = [{ ...createChapter(0), lessons: [createLesson()] }]
  }

  return {
    cover: course.cover || '',
    title: course.title || '',
    description: course.description || '',
    category: course.category || 'education',
    pointsCost: course.pointsCost ?? 0,
    chapters,
  }
}

function buildSyllabusChapters(draft) {
  return (draft.chapters || []).map((ch) => ({
    ...ch,
    lessons: (ch.lessons || []).map((ls) => ({
      ...ls,
      videoEmbed:
        ls.contentType === 'video' && ls.videoSource === 'bilibili'
          ? parseBilibiliEmbed(ls.videoEmbed || ls.videoUrl)
          : ls.videoEmbed,
    })),
  }))
}

/** 更新草稿 → 数据库 update 行（不含 creator_id） */
export function buildCourseUpdateRowFromDraft(draft, { nickname, creatorProfileId } = {}) {
  const category = draft.category
  const catMeta = CATEGORIES.find((c) => c.id === category)
  const pointsCost = Number(draft.pointsCost) || 0
  const isFree = pointsCost === 0
  const priceYuan = isFree ? 0 : pointsCost / POINTS_PER_YUAN
  const chapters = buildSyllabusChapters(draft)

  const firstVideo = chapters
    .flatMap((ch) => ch.lessons)
    .find((ls) => ls.contentType === 'video' && (ls.videoEmbed || ls.videoUrl))

  const instructor = nickname || '同辈学长'
  const idSuffix = String(Date.now()).slice(-6)

  return {
    title: draft.title.trim(),
    description: draft.description?.trim() || '由同辈学长精心打磨，欢迎学习。',
    category,
    category_label: catMeta?.label ?? '未分类',
    points_cost: pointsCost,
    price_yuan: priceYuan,
    is_free: isFree,
    cover_url: draft.cover || '',
    instructor,
    video_type: firstVideo ? 'bilibili' : 'placeholder',
    video_embed: firstVideo?.videoEmbed || '',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    wechat_id: creatorProfileId || `creator_${idSuffix}`,
    wechat_qr: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${creatorProfileId || idSuffix}`,
    syllabus: { chapters },
  }
}

/** 发布草稿 → 数据库 insert 行 */
export function buildCourseRowFromDraft(draft, { userId, nickname, creatorProfileId }) {
  const category = draft.category
  const catMeta = CATEGORIES.find((c) => c.id === category)
  const pointsCost = Number(draft.pointsCost) || 0
  const isFree = pointsCost === 0
  const priceYuan = isFree ? 0 : pointsCost / POINTS_PER_YUAN

  const chapters = buildSyllabusChapters(draft)

  const firstVideo = chapters
    .flatMap((ch) => ch.lessons)
    .find((ls) => ls.contentType === 'video' && (ls.videoEmbed || ls.videoUrl))

  const instructor = nickname || '同辈学长'
  const idSuffix = String(Date.now()).slice(-6)

  return {
    creator_id: userId,
    title: draft.title.trim(),
    description: draft.description?.trim() || '由同辈学长精心打磨，欢迎学习。',
    category,
    category_label: catMeta?.label ?? '未分类',
    points_cost: pointsCost,
    price_yuan: priceYuan,
    is_free: isFree,
    cover_url: draft.cover || '',
    instructor,
    video_type: firstVideo ? 'bilibili' : 'placeholder',
    video_embed: firstVideo?.videoEmbed || '',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    wechat_id: creatorProfileId || `creator_${idSuffix}`,
    wechat_qr: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${creatorProfileId || idSuffix}`,
    featured_score: 0,
    syllabus: { chapters },
  }
}
