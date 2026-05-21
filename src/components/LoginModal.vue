<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useToast } from '../composables/useToast.js'
import {
  DEFAULT_AVATAR_SVG,
  readImageAsDataUrl,
  AVATAR_COMPRESS_THRESHOLD,
} from '../utils/defaultAvatar.js'
import UserAvatar from './UserAvatar.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  initialStep: { type: String, default: 'login' },
})

const emit = defineEmits(['close', 'complete'])

const {
  loginWithEmail,
  formatAuthError,
  setProfile,
  setRole,
  needsIdentity,
  needsProfile,
} = useAuth()
const { show: showToast } = useToast()

const step = ref('login')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loggingIn = ref(false)
const errorMsg = ref('')
const selectedRole = ref(null)

const draftNickname = ref('')
const previewAvatar = ref('')
const avatarUploading = ref(false)
const fileInputRef = ref(null)

const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const passwordValid = computed(() => password.value.length >= 6)
const canLogin = computed(
  () => emailValid.value && passwordValid.value && !loggingIn.value
)
const canConfirmProfile = computed(
  () => draftNickname.value.trim().length >= 2 && !avatarUploading.value
)

const identityOptions = [
  {
    id: 'student',
    title: '我是学生',
    desc: '我想找学长学姐抄近道，高效学习不踩坑',
    icon: '🎓',
    gradient: 'from-sky-500 to-blue-600',
    ring: 'ring-sky-400',
  },
  {
    id: 'creator',
    title: '我是创作者',
    desc: '我想分享我的绝活知识，帮助同辈并赚取收益',
    icon: '✨',
    gradient: 'from-violet-500 to-purple-600',
    ring: 'ring-violet-400',
  },
]

const stepTitle = computed(() => {
  if (step.value === 'login') return '欢迎回来'
  if (step.value === 'profile') return '完善你的个人档案'
  return '选择你的校园身份'
})

const stepSubtitle = computed(() => {
  if (step.value === 'login') return '邮箱 + 密码登录，新用户将自动注册'
  if (step.value === 'profile') return '设置头像与昵称；之后可随时点头像再次修改'
  return '只需选择一次，之后可在头像菜单里切换'
})

const avatarPreviewSrc = computed(() => previewAvatar.value || DEFAULT_AVATAR_SVG)

const isBlockingStep = computed(
  () =>
    (step.value === 'identity' && needsIdentity.value) ||
    (step.value === 'profile' && needsProfile.value)
)

function resetForm() {
  email.value = ''
  password.value = ''
  showPassword.value = false
  errorMsg.value = ''
  selectedRole.value = null
  draftNickname.value = ''
  previewAvatar.value = ''
  loggingIn.value = false
}

function goAfterLogin() {
  if (needsProfile.value) {
    step.value = 'profile'
    previewAvatar.value = ''
    draftNickname.value = ''
  } else if (needsIdentity.value) {
    step.value = 'identity'
  } else {
    emit('complete')
    emit('close')
  }
}

async function handleLogin() {
  if (!canLogin.value) return
  errorMsg.value = ''
  loggingIn.value = true
  try {
    const { isNewUser } = await loginWithEmail(email.value, password.value)
    showToast(isNewUser ? '注册成功，欢迎加入同辈课栈！' : '登录成功', 'success')
    loggingIn.value = false
    goAfterLogin()
  } catch (err) {
    errorMsg.value = formatAuthError(err)
    loggingIn.value = false
  }
}

function triggerAvatarPick() {
  fileInputRef.value?.click()
}

async function onAvatarChange(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  errorMsg.value = ''
  avatarUploading.value = true
  try {
    const needCompress = file.size > AVATAR_COMPRESS_THRESHOLD
    if (needCompress) {
      showToast('大图检测中，正在自动压缩…', 'success', 1500)
    }
    previewAvatar.value = await readImageAsDataUrl(file)
    if (needCompress) {
      showToast('压缩完成，头像已更新', 'success')
    }
  } catch (err) {
    errorMsg.value = err.message || '图片导入失败'
    showToast(errorMsg.value, 'error')
  } finally {
    avatarUploading.value = false
  }
}

async function handleConfirmProfile() {
  if (!canConfirmProfile.value) {
    errorMsg.value = '昵称至少 2 个字'
    return
  }
  try {
    await setProfile({
      nickname: draftNickname.value,
      avatar: previewAvatar.value,
    })
    errorMsg.value = ''
    if (needsIdentity.value) {
      step.value = 'identity'
    } else {
      showToast('档案已保存', 'success')
      emit('complete')
      emit('close')
    }
  } catch (err) {
    errorMsg.value = formatAuthError(err)
    showToast(errorMsg.value, 'error')
  }
}

async function handleConfirmIdentity() {
  if (!selectedRole.value) {
    errorMsg.value = '请先选择一种校园身份'
    return
  }
  try {
    await setRole(selectedRole.value)
    errorMsg.value = ''
    showToast('身份已确认，档案已同步云端', 'success')
    emit('complete')
    emit('close')
  } catch (err) {
    errorMsg.value = formatAuthError(err)
    showToast(errorMsg.value, 'error')
  }
}

function handleClose() {
  emit('close')
}

function onBackdropClick() {
  if (isBlockingStep.value) return
  handleClose()
}

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) {
      step.value = props.initialStep
      if (props.initialStep === 'login') resetForm()
      else errorMsg.value = ''
    } else {
      resetForm()
      step.value = 'login'
    }
  }
)

function onKeydown(e) {
  if (e.key === 'Escape' && props.open && !isBlockingStep.value) {
    handleClose()
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  }
)

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
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
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="stepTitle"
      >
        <div
          class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          @click="onBackdropClick"
        />

        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
        >
          <div
            v-if="open"
            class="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div
              class="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 px-6 py-8 text-white"
            >
              <button
                v-if="!isBlockingStep"
                type="button"
                class="absolute right-4 top-4 rounded-lg p-1.5 text-white/80 hover:bg-white/15"
                aria-label="关闭"
                @click="handleClose"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div
                class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span v-if="step === 'login'">真实账户 · 邮箱密码</span>
                <span v-else-if="step === 'profile'">步骤 {{ needsIdentity ? '1/2' : '1/1' }} · 个人档案</span>
                <span v-else>步骤 2/2 · 选择身份</span>
              </div>
              <h2 class="text-2xl font-bold">{{ stepTitle }}</h2>
              <p class="mt-1 text-sm text-white/85">{{ stepSubtitle }}</p>
            </div>

            <!-- 登录 / 注册 -->
            <div v-if="step === 'login'" class="space-y-5 p-6">
              <div>
                <label for="login-email" class="mb-1.5 block text-sm font-medium text-slate-700">电子邮箱</label>
                <input
                  id="login-email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  placeholder="name@example.com"
                  class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                />
              </div>
              <div>
                <label for="login-password" class="mb-1.5 block text-sm font-medium text-slate-700">密码</label>
                <div class="relative">
                  <input
                    id="login-password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    placeholder="至少 6 位，请自行牢记"
                    class="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    @click="showPassword = !showPassword"
                  >
                    {{ showPassword ? '隐藏' : '显示' }}
                  </button>
                </div>
                <p class="mt-1.5 text-xs text-slate-400">
                  新用户直接点登录，系统将自动注册；老用户输入原密码即可
                </p>
              </div>
              <p v-if="errorMsg" class="text-sm text-red-500">{{ errorMsg }}</p>
              <button
                type="button"
                class="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 font-semibold text-white shadow-lg disabled:opacity-50"
                :disabled="!canLogin"
                @click="handleLogin"
              >
                {{ loggingIn ? '验证中…' : '登录 / 注册' }}
              </button>
            </div>

            <!-- 完善档案 -->
            <div v-else-if="step === 'profile'" class="space-y-5 p-6">
              <div class="flex flex-col items-center">
              <button
                type="button"
                class="group relative inline-flex rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                :disabled="avatarUploading"
                @click.stop="triggerAvatarPick"
              >
                <UserAvatar :src="avatarPreviewSrc" size="lg" />
                <span
                  class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-xs font-medium text-white transition group-hover:bg-black/40"
                >
                  {{ avatarUploading ? '处理中…' : '点击上传' }}
                </span>
              </button>
              <button
                type="button"
                class="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                :disabled="avatarUploading"
                @click.stop="triggerAvatarPick"
              >
                从相册选择图片
              </button>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="onAvatarChange"
                />
                <p class="mt-3 text-xs text-slate-500">
                  支持 JPG / PNG，最大 20MB；超过 2MB 将自动压缩后展示
                </p>
              </div>

              <div>
                <label for="profile-nick" class="mb-1.5 block text-sm font-medium text-slate-700">昵称</label>
                <input
                  id="profile-nick"
                  v-model="draftNickname"
                  type="text"
                  maxlength="20"
                  placeholder="给自己起个响亮的昵称吧（如：高数不挂科学长）"
                  class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                />
              </div>

              <p v-if="errorMsg" class="text-sm text-red-500">{{ errorMsg }}</p>

              <button
                type="button"
                class="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 font-semibold text-white shadow-lg disabled:opacity-50"
                :disabled="!canConfirmProfile"
                @click="handleConfirmProfile"
              >
                下一步
              </button>
            </div>

            <!-- 身份选择 -->
            <div v-else class="space-y-5 p-6">
              <div class="grid gap-4">
                <button
                  v-for="opt in identityOptions"
                  :key="opt.id"
                  type="button"
                  class="group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition"
                  :class="
                    selectedRole === opt.id
                      ? `border-transparent ring-2 ${opt.ring} ring-offset-2`
                      : 'border-slate-200 hover:border-slate-300'
                  "
                  @click="selectedRole = opt.id"
                >
                  <div class="relative flex gap-4">
                    <span
                      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl text-white"
                      :class="`bg-gradient-to-br ${opt.gradient}`"
                    >
                      {{ opt.icon }}
                    </span>
                    <div>
                      <h3 class="font-bold text-slate-900">{{ opt.title }}</h3>
                      <p class="mt-1 text-sm text-slate-500">{{ opt.desc }}</p>
                    </div>
                  </div>
                </button>
              </div>
              <p v-if="errorMsg" class="text-sm text-red-500">{{ errorMsg }}</p>
              <button
                type="button"
                class="w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 font-semibold text-white shadow-lg disabled:opacity-50"
                :disabled="!selectedRole"
                @click="handleConfirmIdentity"
              >
                确认身份，进入同辈课栈
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
