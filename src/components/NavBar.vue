<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import UserMenu from './UserMenu.vue'
import LoginModal from './LoginModal.vue'
import CategoryTabs from './CategoryTabs.vue'

const searchQuery = defineModel('searchQuery', { type: String, default: '' })
const activeCategory = defineModel('activeCategory', { type: String, required: true })

const loginOpen = ref(false)

const emit = defineEmits(['open-wallet', 'open-recharge', 'open-dashboard', 'open-profile-edit'])

const { isLoggedIn, logout: authLogout } = useAuth()

defineProps({
  platformName: {
    type: String,
    default: '同辈课栈',
  },
  tagline: {
    type: String,
    default: '听有结果的人说。在这里，各路学长带你抄近道。',
  },
})

function openLogin() {
  loginOpen.value = true
}

function handleLogout() {
  authLogout()
}

function closeLoginModal() {
  loginOpen.value = false
}

function handleOpenWallet() {
  emit('open-wallet')
}

function handleOpenRecharge() {
  emit('open-recharge')
}

function handleOpenDashboard() {
  emit('open-dashboard')
}

function handleOpenProfileEdit() {
  emit('open-profile-edit')
}
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- 第一行：品牌 + 搜索 + 登录 -->
      <div class="flex flex-wrap items-center gap-4 py-4">
        <div class="flex min-w-0 shrink-0 items-center gap-3 sm:max-w-[220px] lg:max-w-xs">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-md shadow-brand-500/25"
          >
            栈
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-xl font-bold tracking-tight text-slate-900">
              {{ platformName }}
            </h1>
            <p class="line-clamp-2 text-[11px] leading-snug text-slate-500 sm:text-xs">
              {{ tagline }}
            </p>
          </div>
        </div>

        <form
          class="relative min-w-0 flex-1 sm:max-w-md lg:max-w-xl"
          @submit.prevent
        >
          <label for="search" class="sr-only">搜索课程或讲师</label>
          <span
            class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            id="search"
            v-model="searchQuery"
            type="search"
            placeholder="搜索课程、讲师，如 Python、小红书…"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            aria-label="清空搜索"
            @click="searchQuery = ''"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </form>

        <div class="ml-auto shrink-0">
          <button
            v-if="!isLoggedIn"
            type="button"
            class="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            @click="openLogin"
          >
            登录 / 注册
          </button>
          <UserMenu
            v-else
            @logout="handleLogout"
            @open-wallet="handleOpenWallet"
            @open-recharge="handleOpenRecharge"
            @open-dashboard="handleOpenDashboard"
            @open-profile-edit="handleOpenProfileEdit"
          />
        </div>
      </div>

      <!-- 第二行：分类标签（搜索框下方） -->
      <div class="border-t border-slate-100 pb-3 pt-3">
        <CategoryTabs v-model:active-category="activeCategory" />
      </div>
    </div>
  </header>

  <LoginModal :open="loginOpen" @close="closeLoginModal" />
</template>
