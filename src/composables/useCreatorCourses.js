import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '../supabase.js'
import { mapDbCourseToApp } from '../utils/courseMapper.js'

const myCoursesState = ref([])
const loading = ref(false)
const loadError = ref(null)

/**
 * 查询当前创作者自己的课程（数据库字段为 creator_id）
 */
export async function fetchMyCourses(creatorId) {
  if (!isSupabaseConfigured() || !creatorId) {
    myCoursesState.value = []
    return []
  }

  loading.value = true
  loadError.value = null

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const list = (data || []).map(mapDbCourseToApp)
    myCoursesState.value = list
    return list
  } catch (err) {
    console.error('[creator courses]', err)
    loadError.value = err.message || '加载失败'
    myCoursesState.value = []
    throw err
  } finally {
    loading.value = false
  }
}

export async function deleteCourseById(courseId) {
  const { error } = await supabase.from('courses').delete().eq('id', courseId)
  if (error) throw error
  myCoursesState.value = myCoursesState.value.filter((c) => c.id !== courseId)
}

export function useCreatorCourses() {
  return {
    myCourses: myCoursesState,
    loading,
    loadError,
    fetchMyCourses,
    deleteCourseById,
  }
}
