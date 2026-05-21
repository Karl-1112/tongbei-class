<script setup>
import { ref, computed, watch } from 'vue'
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
})

const emit = defineEmits(['close', 'saved'])

const { nickname, avatar, setProfile, formatAuthError } = useAuth()
const { show: showToast } = useToast()

const draftNickname = ref('')
const previewAvatar = ref('')
const avatarUploading = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const fileInputRef = ref(null)

const avatarPreviewSrc = computed(() => previewAvatar.value || DEFAULT_AVATAR_SVG)

const canSave = computed(
  () => draftNickname.value.trim().length >= 2 && !avatarUploading.value && !saving.value
)

function loadCurrentProfile() {
  draftNickname.value = nickname.value || ''
  previewAvatar.value = avatar.value || ''
  errorMsg.value = ''
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

async function handleSave() {
  if (!canSave.value) {
    errorMsg.value = '昵称至少 2 个字'
    return
  }
  saving.value = true
  errorMsg.value = ''
  try {
    await setProfile({
      nickname: draftNickname.value,
      avatar: previewAvatar.value,
    })
    showToast('头像与昵称已更新', 'success')
    emit('saved')
    emit('close')
  } catch (err) {
    errorMsg.value = formatAuthError(err)
    showToast(errorMsg.value, 'error')
  } finally {
    saving.value = false
  }
}

function handleClose() {
  emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) loadCurrentProfile()
  }
)
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
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="编辑个人档案"
      >
        <div
          class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          @click="handleClose"
        />

        <div
          class="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          @click.stop
        >
          <div
            class="relative bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 px-6 py-6 text-white"
          >
            <button
              type="button"
              class="absolute right-4 top-4 rounded-lg p-1.5 text-white/80 hover:bg-white/15"
              aria-label="关闭"
              @click="handleClose"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 class="text-xl font-bold">编辑个人档案</h2>
            <p class="mt-1 text-sm text-white/85">随时修改头像与昵称，将同步至云端</p>
          </div>

          <div class="space-y-5 p-6">
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
                  {{ avatarUploading ? '处理中…' : '点击更换头像' }}
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
                支持 JPG / PNG，最大 20MB；超过 2MB 自动压缩
              </p>
            </div>

            <div>
              <label for="edit-profile-nick" class="mb-1.5 block text-sm font-medium text-slate-700">
                昵称
              </label>
              <input
                id="edit-profile-nick"
                v-model="draftNickname"
                type="text"
                maxlength="20"
                placeholder="给自己起个响亮的昵称"
                class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>

            <p v-if="errorMsg" class="text-sm text-red-500">{{ errorMsg }}</p>

            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                :disabled="saving"
                @click="handleClose"
              >
                取消
              </button>
              <button
                type="button"
                class="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                :disabled="!canSave"
                @click="handleSave"
              >
                {{ saving ? '保存中…' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
