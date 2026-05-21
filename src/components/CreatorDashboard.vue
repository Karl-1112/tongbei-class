<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useCreatorCourses } from '../composables/useCreatorCourses.js'
import { useToast } from '../composables/useToast.js'
import UserAvatar from './UserAvatar.vue'
import CreatorCourseManageCard from './CreatorCourseManageCard.vue'
import ConfirmModal from './ConfirmModal.vue'

const emit = defineEmits(['back', 'create', 'edit', 'open-profile-edit'])

const {
  displayName,
  displayAvatar,
  nickname,
  identityLabel,
  bindSupabase,
  supabaseUserId,
} = useAuth()

const { myCourses, loading, loadError, fetchMyCourses, deleteCourseById } =
  useCreatorCourses()
const { show: showToast } = useToast()

const deleteTarget = ref(null)
const deleteOpen = ref(false)
const deleting = ref(false)

const courseCount = computed(() => myCourses.value.length)

const creatorTagline = computed(() => {
  const n = nickname.value
  if (n) return `${n} · 同辈创作者`
  return '资深同辈学长 · 创作者'
})

async function loadDashboard() {
  try {
    const user = await bindSupabase()
    const uid = user?.id || supabaseUserId.value
    if (!uid) {
      showToast('请先完成登录并选择创作者身份', 'error')
      return
    }
    await fetchMyCourses(uid)
  } catch (err) {
    showToast(err.message || '加载课程失败', 'error')
  }
}

function requestDelete(course) {
  deleteTarget.value = course
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteCourseById(deleteTarget.value.id)
    showToast('课程已下架并从云端删除', 'success')
    deleteOpen.value = false
    deleteTarget.value = null
  } catch (err) {
    showToast(err.message || '删除失败', 'error')
  } finally {
    deleting.value = false
  }
}

function cancelDelete() {
  deleteOpen.value = false
  deleteTarget.value = null
}

onMounted(() => {
  loadDashboard()
})

defineExpose({ refresh: loadDashboard })
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-violet-50/40 via-white to-slate-50">
    <header class="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <button
          type="button"
          class="text-sm font-medium text-slate-500 hover:text-slate-800"
          @click="emit('back')"
        >
          ← 返回首页
        </button>
        <h1 class="text-base font-bold text-slate-900 sm:text-lg">课程管理</h1>
        <button
          type="button"
          class="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 sm:text-sm"
          @click="emit('create')"
        >
          + 新课程
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <!-- 个人主页头部 -->
      <section
        class="overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-violet-500/20 sm:p-8"
      >
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
          <button
            type="button"
            class="group relative shrink-0 rounded-full ring-4 ring-white/30 transition hover:ring-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-violet-600"
            title="编辑头像与昵称"
            @click="emit('open-profile-edit')"
          >
            <UserAvatar :src="displayAvatar" :name="displayName" size="lg" />
            <span
              class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm text-violet-700 shadow-md"
            >
              ✎
            </span>
          </button>
          <div class="min-w-0 flex-1">
            <span
              class="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur"
            >
              {{ identityLabel }}
            </span>
            <h2 class="mt-2 text-2xl font-bold sm:text-3xl">{{ displayName }}</h2>
            <p class="mt-1 text-sm text-violet-100">{{ creatorTagline }}</p>
            <button
              type="button"
              class="mt-2 text-xs font-medium text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white"
              @click="emit('open-profile-edit')"
            >
              修改头像与昵称
            </button>
          </div>
        </div>

        <div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div class="rounded-2xl bg-white/15 px-4 py-4 backdrop-blur">
            <p class="text-xs font-medium text-violet-100">已发布课程</p>
            <p class="mt-1 text-3xl font-bold">{{ courseCount }}</p>
            <p class="text-xs text-violet-200">门</p>
          </div>
          <div class="rounded-2xl bg-white/15 px-4 py-4 backdrop-blur">
            <p class="text-xs font-medium text-violet-100">免费课</p>
            <p class="mt-1 text-3xl font-bold">
              {{ myCourses.filter((c) => c.isFree).length }}
            </p>
            <p class="text-xs text-violet-200">门</p>
          </div>
          <div class="col-span-2 rounded-2xl bg-white/15 px-4 py-4 backdrop-blur sm:col-span-1">
            <p class="text-xs font-medium text-violet-100">管理权限</p>
            <p class="mt-1 text-sm font-semibold">仅本人可见/编辑</p>
            <p class="text-xs text-violet-200">creator_id 隔离</p>
          </div>
        </div>
      </section>

      <!-- 课程列表 -->
      <section class="mt-10">
        <div class="mb-6 flex items-center justify-between">
          <h3 class="text-xl font-bold text-slate-900">我发布的课程</h3>
          <button
            type="button"
            class="text-sm font-medium text-violet-600 hover:text-violet-800"
            :disabled="loading"
            @click="loadDashboard"
          >
            刷新列表
          </button>
        </div>

        <div
          v-if="loading"
          class="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white py-20 text-slate-500"
        >
          <span
            class="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"
          />
          正在加载您的课程…
        </div>

        <div
          v-else-if="loadError"
          class="rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center text-sm text-red-700"
        >
          {{ loadError }}
          <button
            type="button"
            class="mt-4 block w-full rounded-lg bg-red-600 py-2 text-white"
            @click="loadDashboard"
          >
            重试
          </button>
        </div>

        <div
          v-else-if="courseCount === 0"
          class="flex flex-col items-center rounded-3xl border border-dashed border-violet-200 bg-white px-8 py-16 text-center"
        >
          <span class="text-5xl">🚀</span>
          <h4 class="mt-4 text-lg font-bold text-slate-800">
            您还没有发布过任何破局课程
          </h4>
          <p class="mt-2 max-w-sm text-sm text-slate-500">
            点击上方按钮开启第一课吧！发布后仅在本页与首页公开展示。
          </p>
          <button
            type="button"
            class="mt-6 rounded-xl bg-violet-600 px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-violet-700"
            @click="emit('create')"
          >
            开启第一课
          </button>
        </div>

        <div
          v-else
          class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <CreatorCourseManageCard
            v-for="course in myCourses"
            :key="course.id"
            :course="course"
            @edit="emit('edit', $event)"
            @delete="requestDelete"
          />
        </div>
      </section>
    </main>

    <ConfirmModal
      :open="deleteOpen"
      title="下架课程"
      message="确定要下架这门课程吗？下架后同学们将无法在首页看到它。"
      confirm-label="确认下架"
      cancel-label="再想想"
      danger
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
