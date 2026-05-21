import { ref } from 'vue'
import { REDEEM_CODE_MAP } from '../data/redeemCodes.js'

const STORAGE_KEY = 'peer-course-redeem'

function loadUsed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw).usedCodes ?? []
  } catch {
    /* ignore */
  }
  return []
}

const usedCodes = ref(loadUsed())

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ usedCodes: usedCodes.value })
  )
}

export function useRedeem() {
  function isCodeUsed(code) {
    return usedCodes.value.includes(code)
  }

  /**
   * @returns {{ ok: true, points: number } | { ok: false }}
   */
  function redeem(codeInput) {
    const code = String(codeInput ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s/g, '')

    if (!code) return { ok: false }

    const config = REDEEM_CODE_MAP[code]
    if (!config) return { ok: false }

    if (isCodeUsed(code)) return { ok: false }

    usedCodes.value = [...usedCodes.value, code]
    persist()

    return { ok: true, points: config.points, code }
  }

  return {
    usedCodes,
    isCodeUsed,
    redeem,
    REDEEM_CODE_MAP,
  }
}
