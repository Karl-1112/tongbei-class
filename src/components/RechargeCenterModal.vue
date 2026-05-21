<script setup>
import { ref, watch } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useRedeem } from '../composables/useRedeem.js'
import { useToast } from '../composables/useToast.js'
import { RECHARGE_PACKAGES } from '../data/redeemCodes.js'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const { points, addPoints } = useAuth()
const { redeem } = useRedeem()
const { show: showToast } = useToast()

const activeTab = ref('packages')
const redeemInput = ref('')
const redeeming = ref(false)
const inlineError = ref('')

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
      activeTab.value = 'redeem'
      redeemInput.value = ''
      inlineError.value = ''
      redeeming.value = false
    }
  }
)

function handleClose() {
  emit('close')
}

async function handleRedeem() {
  if (redeeming.value) return
  inlineError.value = ''

  const code = redeemInput.value.trim()
  if (!code) {
    inlineError.value = '兑换码无效或已被使用，请检查后重试'
    return
  }

  redeeming.value = true
  await new Promise((r) => setTimeout(r, 1000))

  const result = redeem(code)
  redeeming.value = false

  if (!result.ok) {
    inlineError.value = '兑换码无效或已被使用，请检查后重试'
    return
  }

  addPoints(result.points)
  inlineError.value = ''
  redeemInput.value = ''
  showToast(`兑换成功！${result.points} 积分已充值到您的钱包。`, 'success', 3200)
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
        class="fixed inset-0 z-[58] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="充值中心"
      >
        <div
          class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          @click="handleClose"
        />

        <div
          class="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <!-- 头部 -->
          <div class="border-b border-slate-100 bg-gradient-to-r from-brand-50 to-sky-50 px-6 py-5">
            <button
              type="button"
              class="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/80 hover:text-slate-600"
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
            <h2 class="text-xl font-bold text-slate-900">充值中心</h2>
            <p class="mt-1 text-sm text-slate-500">
              当前余额：
              <span class="font-semibold text-amber-600">{{ points }} 积分</span>
              <span class="text-slate-400">（1 元 = 10 积分）</span>
            </p>
          </div>

          <!-- Tab -->
          <div class="flex border-b border-slate-100 px-4 pt-3">
            <button
              type="button"
              class="relative flex-1 pb-3 text-sm font-semibold transition"
              :class="
                activeTab === 'packages'
                  ? 'text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              "
              @click="activeTab = 'packages'"
            >
              充值面额
              <span
                v-if="activeTab === 'packages'"
                class="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-brand-600"
              />
            </button>
            <button
              type="button"
              class="relative flex-1 pb-3 text-sm font-semibold transition"
              :class="
                activeTab === 'redeem'
                  ? 'text-brand-600'
                  : 'text-slate-400 hover:text-slate-600'
              "
              @click="activeTab = 'redeem'"
            >
              兑换码充值
              <span
                v-if="activeTab === 'redeem'"
                class="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-brand-600"
              />
            </button>
          </div>

          <div class="overflow-y-auto px-6 py-5">
            <!-- 面额 Tab -->
            <div v-if="activeTab === 'packages'" class="space-y-3">
              <p class="text-xs text-slate-500">
                在公众号或微店购买后，将获得对应面额的兑换码，请切换到「兑换码充值」输入。
              </p>
              <div
                v-for="pkg in RECHARGE_PACKAGES"
                :key="pkg.id"
                class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/30"
              >
                <div>
                  <p class="font-bold text-slate-900">{{ pkg.priceLabel }}</p>
                  <p class="text-sm text-brand-600">{{ pkg.points }} 积分</p>
                  <p class="mt-0.5 text-xs text-slate-400">{{ pkg.desc }}</p>
                </div>
                <div class="text-right">
                  <span
                    class="inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-mono text-slate-500 ring-1 ring-slate-200"
                  >
                    示例码 {{ pkg.codeHint }}
                  </span>
                  <p class="mt-2 text-[10px] text-slate-400">线上下单后获码</p>
                </div>
              </div>
              <button
                type="button"
                class="w-full rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
                @click="activeTab = 'redeem'"
              >
                已有兑换码？去兑换 →
              </button>
            </div>

            <!-- 兑换码 Tab -->
            <div v-else class="space-y-4">
              <div
                class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"
              >
                <span class="font-semibold">MVP 测试码：</span>
                STU666（60积分）· VIP888（300积分）· KING999（1280积分）
              </div>

              <div>
                <label
                  for="redeem-code"
                  class="mb-2 block text-sm font-medium text-slate-700"
                >
                  兑换码
                </label>
                <input
                  id="redeem-code"
                  v-model="redeemInput"
                  type="text"
                  maxlength="32"
                  placeholder="请输入您购买的 16 位充值兑换码"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-mono text-base tracking-wider text-slate-900 uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  :disabled="redeeming"
                  @input="
                    redeemInput = redeemInput.toUpperCase();
                    inlineError = ''
                  "
                  @keydown.enter="handleRedeem"
                />
              </div>

              <p
                v-if="inlineError"
                class="flex items-center gap-1.5 text-sm text-red-600"
                role="alert"
              >
                <svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                {{ inlineError }}
              </p>

              <button
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:from-brand-600 hover:to-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                :disabled="redeeming || !redeemInput.trim()"
                @click="handleRedeem"
              >
                <svg
                  v-if="redeeming"
                  class="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {{ redeeming ? '兑换中…' : '立即兑换' }}
              </button>

              <p class="text-center text-xs leading-relaxed text-slate-400">
                不知道如何获取兑换码？
                <a
                  href="#"
                  class="text-brand-600 underline-offset-2 hover:underline"
                  @click.prevent
                >点击此处关注学长公众号</a>
                或
                <a
                  href="#"
                  class="text-brand-600 underline-offset-2 hover:underline"
                  @click.prevent
                >点击前往微店自动购买</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
