export function createQuestionId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function createOptionId() {
  return `o_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function createEmptyExam() {
  return {
    summaryExplain: '认真审题，错题请对照学长解析巩固知识点。',
    questions: [],
  }
}

export function createSingleChoiceQuestion() {
  const o1 = createOptionId()
  const o2 = createOptionId()
  return {
    id: createQuestionId(),
    type: 'single',
    stem: '',
    explanation: '',
    options: [
      { id: o1, text: '选项 A' },
      { id: o2, text: '选项 B' },
    ],
    correctOptionId: o1,
    blankAnswer: '',
  }
}

export function createBlankQuestion() {
  return {
    id: createQuestionId(),
    type: 'blank',
    stem: '',
    explanation: '',
    options: [],
    correctOptionId: '',
    blankAnswer: '',
  }
}

export function normalizeAnswer(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

/** 判断单题是否正确 */
export function gradeQuestion(question, userAnswer) {
  if (!question) return false
  if (question.type === 'single') {
    return userAnswer === question.correctOptionId
  }
  if (question.type === 'blank') {
    const ua = normalizeAnswer(userAnswer)
    const key = normalizeAnswer(question.blankAnswer)
    if (!key) return false
    return ua === key || ua.includes(key)
  }
  return false
}

/** 批改整张试卷 */
export function gradeExam(exam, answersMap) {
  const questions = exam?.questions ?? []
  const details = questions.map((q) => {
    const userAnswer = answersMap[q.id]
    const correct = gradeQuestion(q, userAnswer)
    return {
      questionId: q.id,
      correct,
      userAnswer,
      question: q,
    }
  })
  const correctCount = details.filter((d) => d.correct).length
  const total = questions.length
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
  return { score, correctCount, total, details }
}
