<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useCommerce } from '../composables/useCommerce.js'
import UserAvatar from './UserAvatar.vue'

const emit = defineEmits([
  'logout',
  'open-wallet',
  'open-recharge',
  'open-dashboard',
  'open-profile-edit',
])

const {
  identityLabel,
  points,
  phoneMasked,
  displayName,
  displayAvatar,
  role,
  switchRole,
  creatorProfileId,
} = useAuth()

const { getCreatorWallet } = useCommerce()

const creatorWallet = computed(() => getCreatorWallet(creatorProfileId.value))

const menuOpen = ref(false)
const menuRef = ref(null)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

function handleSwitchRole() {
  switchRole()
  closeMenu()
}

function handleOpenWallet() {
  emit('open-wallet')
  closeMenu()
}

function handleOpenRecharge() {
  emit('open-recharge')
  closeMenu()
}

function handleOpenDashboard() {
  emit('open-dashboard')
  closeMenu()
}

function handleEditProfile(e) {
  e?.stopPropagation?.()
  emit('open-profile-edit')
  // 延迟关菜单，避免 document 点击监听与菜单卸载抢事件
  window.setTimeout(() => {
    closeMenu()
  }, 0)
}

function handleLogout() {
  emit('logout')
  closeMenu()
}

function onClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    closeMenu()
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 ring-2 ring-white transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      :aria-expanded="menuOpen"
      aria-haspopup="true"
      @click.stop="toggleMenu"
    >
      <UserAvatar :src="displayAvatar" :name="displayName" size="md" />
      <span class="hidden max-w-[100px] truncate text-sm font-semibold text-slate-800 sm:inline">
        {{ displayName }}
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="menuOpen"
        class="absolute right-0 top-full z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        role="menu"
      >
        <div class="border-b border-slate-100 px-4 py-3">
          <button
            type="button"
            class="group w-full rounded-xl p-2 text-left transition hover:bg-slate-50"
            @click.stop="handleEditProfile"
          >
            <div class="flex items-center gap-3 pointer-events-none">
              <div class="relative">
                <UserAvatar :src="displayAvatar" :name="displayName" size="sm" />
                <span
                  class="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white shadow"
                  aria-hidden="true"
                >
                  ✎
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold text-slate-900 group-hover:text-brand-700">
                  {{ displayName }}
                </p>
                <p class="text-xs text-slate-400">{{ phoneMasked }}</p>
                <p class="mt-0.5 text-xs font-medium text-brand-600">点击编辑头像与昵称</p>
              </div>
            </div>
          </button>
          <p class="mt-2 text-sm text-slate-700">
            当前身份：
            <span
              class="inline-flex rounded-md px-2 py-0.5 text-xs font-medium"
              :class="role === 'creator' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'"
            >
              {{ identityLabel }}
            </span>
          </p>
          <p v-if="role === 'student'" class="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
            <span class="text-amber-500">★</span>
            <span>{{ points }} 积分</span>
          </p>
        </div>

        <div
          v-if="role === 'creator'"
          class="border-b border-violet-100 bg-violet-50/80 px-4 py-3"
        >
          <p class="text-xs font-semibold text-violet-700">创作者个人钱包</p>
          <p class="mt-2 text-sm text-slate-700">
            已售出
            <span class="font-bold text-violet-700">{{ creatorWallet.salesCount }}</span>
            单 · 累计
            <span class="font-bold text-amber-600">{{ creatorWallet.totalPoints }}</span>
            积分
          </p>
          <button
            type="button"
            class="mt-2 w-full rounded-lg bg-violet-600 py-2 text-xs font-semibold text-white hover:bg-violet-700"
            @click="handleOpenWallet"
          >
            查看钱包详情
          </button>
        </div>

        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
          @click.stop="handleEditProfile"
        >
          ✎ 编辑头像与昵称
        </button>

        <button
          v-if="role === 'creator'"
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-violet-700 hover:bg-violet-50"
          @click="handleOpenDashboard"
        >
          我的主页 / 课程管理
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
          @click="handleSwitchRole"
        >
          切换身份
        </button>

        <button
          v-if="role === 'student'"
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
          @click="handleOpenRecharge"
        >
          去充值
        </button>

        <div class="my-1 border-t border-slate-100" />

        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
          @click="handleLogout"
        >
          退出登录
        </button>
      </div>
    </Transition>
  </div>
</template>
