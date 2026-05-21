<script setup>
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useCommerce } from '../composables/useCommerce.js'
const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const { creatorProfileId } = useAuth()
const { getCreatorWallet } = useCommerce()

const wallet = computed(() => getCreatorWallet(creatorProfileId.value))

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[55] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="创作者个人钱包"
      >
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="handleClose" />

        <div
          class="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div class="bg-gradient-to-br from-violet-600 to-purple-700 px-6 py-6 text-white">
            <button
              type="button"
              class="absolute right-4 top-4 rounded-lg p-1.5 text-white/80 hover:bg-white/15"
              aria-label="关闭"
              @click="handleClose"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <p class="text-xs font-medium text-violet-200">创作者个人钱包 · Mock</p>
            <h2 class="mt-1 text-2xl font-bold">收益总览</h2>
            <p class="mt-1 text-sm text-violet-100">演示账号绑定：小林学姐的课程</p>
          </div>

          <div class="space-y-4 p-6">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-violet-50 p-4 text-center">
                <p class="text-2xl font-bold text-violet-700">{{ wallet.salesCount }}</p>
                <p class="mt-1 text-xs text-slate-500">已售出（单）</p>
              </div>
              <div class="rounded-xl bg-amber-50 p-4 text-center">
                <p class="text-2xl font-bold text-amber-700">{{ wallet.totalPoints }}</p>
                <p class="mt-1 text-xs text-slate-500">累计赚取（积分）</p>
              </div>
            </div>

            <div
              class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center"
            >
              <p class="text-sm text-slate-600">可提现金额（1元=10积分）</p>
              <p class="mt-1 text-3xl font-bold text-emerald-700">
                ¥ {{ wallet.withdrawYuan }}
              </p>
              <p class="mt-2 text-xs text-slate-400">
                约合 {{ wallet.totalPoints }} 积分 · 提现功能下一版上线
              </p>
            </div>

            <p class="text-center text-xs text-slate-400">
              学生用积分解锁你的收费课后，收益会实时累计在此
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
