import { ref, computed } from 'vue'
import { useCourseStore } from './useCourseStore.js'
import { CATEGORIES, CATEGORY_ALL } from '../data/categories.js'
import { sortFreeFirst } from '../utils/courseSort.js'

export function useCourseFilter() {
  const { courses, isCatalogEmpty, featuredFreeCourses } = useCourseStore()

  const searchQuery = ref('')
  const activeCategory = ref(CATEGORY_ALL)

  const filteredCourses = computed(() => {
    let list = courses.value

    if (activeCategory.value !== CATEGORY_ALL) {
      list = list.filter((c) => c.category === activeCategory.value)
    }

    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q)
      )
    }

    return sortFreeFirst(list)
  })

  const isEmpty = computed(() => filteredCourses.value.length === 0)
  const isSearchEmpty = computed(
    () => !isCatalogEmpty.value && isEmpty.value
  )

  const activeCategoryLabel = computed(() => {
    const cat = CATEGORIES.find((c) => c.id === activeCategory.value)
    return cat?.label ?? '全部'
  })

  function setCategory(id) {
    activeCategory.value = id
  }

  function clearSearch() {
    searchQuery.value = ''
  }

  return {
    searchQuery,
    activeCategory,
    filteredCourses,
    featuredFreeCourses,
    isCatalogEmpty,
    isEmpty,
    isSearchEmpty,
    activeCategoryLabel,
    setCategory,
    clearSearch,
  }
}
