<script setup>
import { ref, onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import CourseCard from './components/CourseCard.vue'
import CourseModal from './components/CourseModal.vue'
import CourseListEmpty from './components/CourseListEmpty.vue'
import HomeEmptyState from './components/HomeEmptyState.vue'
import FreeFeaturedSection from './components/FreeFeaturedSection.vue'
import CourseCreatePage from './components/CourseCreatePage.vue'
import CreatorDashboard from './components/CreatorDashboard.vue'
import CreatorWalletModal from './components/CreatorWalletModal.vue'
import RechargeCenterModal from './components/RechargeCenterModal.vue'
import ToastHost from './components/ToastHost.vue'
import ProfileEditModal from './components/ProfileEditModal.vue'
import { useAuth } from './composables/useAuth.js'
import { useCourseFilter } from './composables/useCourseFilter.js'
import { useCourseStore } from './composables/useCourseStore.js'

const { role, isLoggedIn } = useAuth()
const { refresh, loading: coursesLoading } = useCourseStore()

const {
  searchQuery,
  activeCategory,
  filteredCourses,
  featuredFreeCourses,
  isCatalogEmpty,
  isEmpty,
  isSearchEmpty,
  activeCategoryLabel,
} = useCourseFilter()

/** home | dashboard | create */
const currentView = ref('home')
const returnView = ref('home')
const editingCourse = ref(null)
const dashboardRef = ref(null)

const selectedCourse = ref(null)
const modalOpen = ref(false)
const walletOpen = ref(false)
const rechargeOpen = ref(false)
const profileEditOpen = ref(false)

function openCourse(course) {
  selectedCourse.value = course
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}

function openCreatorWallet() {
  walletOpen.value = true
}

function openRecharge() {
  rechargeOpen.value = true
}

function openProfileEdit() {
  profileEditOpen.value = true
}

function openDashboard() {
  currentView.value = 'dashboard'
}

function openCreateCourse(from = 'home') {
  returnView.value = from
  editingCourse.value = null
  currentView.value = 'create'
}

function openEditCourse(course) {
  returnView.value = 'dashboard'
  editingCourse.value = course
  currentView.value = 'create'
}

function finishEditor() {
  refresh()
  currentView.value = returnView.value
  editingCourse.value = null
  if (returnView.value === 'dashboard') {
    dashboardRef.value?.refresh?.()
  }
}

function onCoursePublished() {
  returnView.value = returnView.value === 'dashboard' ? 'dashboard' : 'home'
  finishEditor()
}

function onCourseUpdated() {
  returnView.value = 'dashboard'
  finishEditor()
}

function onCreateCancel() {
  currentView.value = returnView.value
  editingCourse.value = null
}

function onDashboardBack() {
  currentView.value = 'home'
}

onMounted(() => {
  refresh()
})
</script>

<template>
  <div class="min-h-screen">
    <ToastHost />

    <ProfileEditModal
      :open="profileEditOpen"
      @close="profileEditOpen = false"
      @saved="profileEditOpen = false"
    />

    <CourseCreatePage
      v-if="currentView === 'create'"
      :edit-course="editingCourse"
      @published="onCoursePublished"
      @updated="onCourseUpdated"
      @cancel="onCreateCancel"
    />

    <CreatorDashboard
      v-else-if="currentView === 'dashboard'"
      ref="dashboardRef"
      @back="onDashboardBack"
      @create="openCreateCourse('dashboard')"
      @edit="openEditCourse"
      @open-profile-edit="openProfileEdit"
    />

    <template v-else>
      <NavBar
        v-model:search-query="searchQuery"
        v-model:active-category="activeCategory"
        platform-name="同辈课栈"
        @open-wallet="openCreatorWallet"
        @open-recharge="openRecharge"
        @open-dashboard="openDashboard"
        @open-profile-edit="openProfileEdit"
      />

      <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section
          v-if="isLoggedIn && role === 'creator'"
          class="mb-8 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 p-6 shadow-sm"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span
                class="inline-flex items-center rounded-full bg-violet-600/10 px-3 py-1 text-xs font-semibold text-violet-700"
              >
                创作者工作台
              </span>
              <h2 class="mt-2 text-xl font-bold text-slate-900">
                发布你的同辈好课，帮助更多人抄近道
              </h2>
              <p class="mt-1 text-sm text-slate-600">
                课程发布至 Supabase 云端，全站学员实时可见
              </p>
            </div>
            <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-700 hover:to-purple-700"
                @click="openCreateCourse('home')"
              >
                + 创建新课程
              </button>
              <button
                type="button"
                class="rounded-xl border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                @click="openDashboard"
              >
                课程管理
              </button>
              <button
                type="button"
                class="rounded-xl border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                @click="openCreatorWallet"
              >
                创作者钱包
              </button>
            </div>
          </div>
        </section>

        <div
          v-if="coursesLoading"
          class="mb-8 flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white py-16 text-slate-500"
        >
          <span
            class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"
          />
          正在从云端加载课程…
        </div>

        <FreeFeaturedSection
          v-else-if="!isCatalogEmpty && featuredFreeCourses.length"
          :courses="featuredFreeCourses"
          @select="openCourse"
        />

        <section v-if="!coursesLoading && !isCatalogEmpty" class="mb-8">
          <h2 class="text-2xl font-bold text-slate-900">精选同辈好课</h2>
          <p class="mt-1 text-slate-500">
            <template v-if="!isLoggedIn || role === 'student'">
              全品类多模块 · 免费课优先 · 由学长创作者发布
              <span v-if="filteredCourses.length" class="text-slate-400">
                · 当前 {{ filteredCourses.length }} 门
              </span>
            </template>
            <template v-else-if="role === 'creator'">
              学生视角预览 · 你发布的课会出现在这里
            </template>
          </p>
        </section>

        <section
          class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="课程列表"
        >
          <HomeEmptyState v-if="!coursesLoading && isCatalogEmpty">
            <button
              v-if="isLoggedIn && role === 'creator'"
              type="button"
              class="mt-6 rounded-xl bg-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-violet-700"
              @click="openCreateCourse('home')"
            >
              成为第一个破局者 · 创建新课程
            </button>
          </HomeEmptyState>

          <template v-else-if="!isEmpty">
            <CourseCard
              v-for="course in filteredCourses"
              :key="course.id"
              :course="course"
              @select="openCourse"
            />
          </template>

          <CourseListEmpty
            v-else-if="isSearchEmpty"
            :search-query="searchQuery"
            :category-label="activeCategoryLabel"
          />
        </section>
      </main>

      <footer class="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p>同辈课栈 · 全品类同辈知识聚合平台</p>
        <p class="mt-1 text-xs">听有结果的人说 · Supabase 云端课程</p>
      </footer>

      <CourseModal
        :course="selectedCourse"
        :open="modalOpen"
        @close="closeModal"
      />

      <CreatorWalletModal :open="walletOpen" @close="walletOpen = false" />

      <RechargeCenterModal :open="rechargeOpen" @close="rechargeOpen = false" />
    </template>
  </div>
</template>
