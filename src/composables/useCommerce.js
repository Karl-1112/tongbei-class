import { ref, computed } from 'vue'
import { DEMO_CREATOR_ID } from '../utils/pricing.js'

const STORAGE_KEY = 'peer-course-commerce'

function loadCommerce() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return {
    purchases: {},
    creatorWallets: {},
  }
}

const commerceState = ref(loadCommerce())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(commerceState.value))
}

export function useCommerce() {
  function getUnlockedIds(phone) {
    if (!phone) return []
    return commerceState.value.purchases[phone] ?? []
  }

  function isUnlocked(phone, courseId) {
    return getUnlockedIds(phone).includes(courseId)
  }

  function unlockCourse(phone, courseId) {
    const list = getUnlockedIds(phone)
    if (list.includes(courseId)) return
    commerceState.value = {
      ...commerceState.value,
      purchases: {
        ...commerceState.value.purchases,
        [phone]: [...list, courseId],
      },
    }
    persist()
  }

  function recordCreatorSale(creatorId, points) {
    const prev = commerceState.value.creatorWallets[creatorId] ?? {
      salesCount: 0,
      totalPoints: 0,
    }
    commerceState.value = {
      ...commerceState.value,
      creatorWallets: {
        ...commerceState.value.creatorWallets,
        [creatorId]: {
          salesCount: prev.salesCount + 1,
          totalPoints: prev.totalPoints + points,
        },
      },
    }
    persist()
  }

  function getCreatorWallet(creatorId) {
    const w = commerceState.value.creatorWallets[creatorId] ?? {
      salesCount: 0,
      totalPoints: 0,
    }
    return {
      salesCount: w.salesCount,
      totalPoints: w.totalPoints,
      withdrawYuan: (w.totalPoints / 10).toFixed(1),
    }
  }

  const demoCreatorWallet = computed(() => getCreatorWallet(DEMO_CREATOR_ID))

  return {
    commerceState,
    getUnlockedIds,
    isUnlocked,
    unlockCourse,
    recordCreatorSale,
    getCreatorWallet,
    demoCreatorWallet,
    DEMO_CREATOR_ID,
  }
}
