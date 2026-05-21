function lessonToDisplay(lesson) {
  const resources = []
  if (lesson.contentType === 'text' && lesson.textContent) {
    resources.push({ type: 'pdf', label: '文字讲义' })
  }
  if (lesson.contentType === 'exam') {
    const n = lesson.exam?.questions?.length ?? 0
    resources.push({
      type: 'quiz',
      label: n ? `章节测验 · ${n} 题` : '章节测验（待配置）',
    })
  }
  if (lesson.contentType === 'video' && lesson.localVideoName) {
    resources.push({ type: 'pdf', label: `本地视频：${lesson.localVideoName}` })
  }
  return {
    id: lesson.id,
    title: lesson.title || '未命名小节',
    durationMin: lesson.durationMin || 10,
    resources,
    contentType: lesson.contentType,
    rawLesson: lesson,
  }
}

function computeStats(chapters) {
  let totalMinutes = 0
  let lessonCount = 0
  const mapped = chapters.map((ch) => ({
    title: ch.title || '未命名章节',
    lessons: (ch.lessons || []).map((ls) => {
      totalMinutes += ls.durationMin || 10
      lessonCount += 1
      return lessonToDisplay(ls)
    }),
  }))
  return {
    chapterCount: mapped.length,
    lessonCount,
    totalMinutes,
    chapters: mapped,
  }
}

export function getSyllabusForCourse(course) {
  if (course?.syllabus?.chapters?.length) {
    return computeStats(course.syllabus.chapters)
  }
  return {
    chapterCount: 0,
    lessonCount: 0,
    totalMinutes: 0,
    chapters: [],
  }
}

/** 根据 lesson id 查找原始小节 */
export function findLessonInCourse(course, lessonId) {
  for (const ch of course?.syllabus?.chapters ?? []) {
    const found = ch.lessons?.find((ls) => ls.id === lessonId)
    if (found) return found
  }
  return null
}
