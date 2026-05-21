import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../supabase.js'
import { mapDbCourseToApp } from '../utils/courseMapper.js'
import { sortFreeFirst } from '../utils/courseSort.js'

export const FEATURED_FREE_LIMIT = 3

const coursesState = ref([])
const loading = ref(false)
const loadError = ref(null)
let fetchPromise = null

async function fetchFromSupabase() {
  if (!isSupabaseConfigured()) {
    coursesState.value = []
    loadError.value = '未配置 Supabase 环境变量'
    return
  }

  loading.value = true
  loadError.value = null

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    coursesState.value = sortFreeFirst((data || []).map(mapDbCourseToApp))
  } catch (err) {
    console.error('[courses] fetch failed', err)
    loadError.value = err.message || '加载课程失败'
    coursesState.value = []
  } finally {
    loading.value = false
    fetchPromise = null
  }
}

export function useCourseStore() {
  const courses = computed(() => coursesState.value)

  const isCatalogEmpty = computed(() => !loading.value && coursesState.value.length === 0)

  const freeCourses = computed(() =>
    sortFreeFirst(coursesState.value.filter((c) => c.isFree))
  )

  const featuredFreeCourses = computed(() =>
    [...freeCourses.value]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, FEATURED_FREE_LIMIT)
  )

  function refresh() {
    if (!fetchPromise) {
      fetchPromise = fetchFromSupabase()
    }
    return fetchPromise
  }

  function getCourseById(id) {
    return coursesState.value.find((c) => c.id === id)
  }

  return {
    courses,
    loading,
    loadError,
    isCatalogEmpty,
    featuredFreeCourses,
    refresh,
    getCourseById,
  }
}
