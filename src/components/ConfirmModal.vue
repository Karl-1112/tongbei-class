<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '确认操作' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: '确认' },
  cancelLabel: { type: String, default: '取消' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
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
        class="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
        @click.self="emit('cancel')"
      >
        <div
          class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          role="alertdialog"
          aria-modal="true"
          @click.stop
        >
          <h3 class="text-lg font-bold text-slate-900">{{ title }}</h3>
          <p class="mt-3 text-sm leading-relaxed text-slate-600">{{ message }}</p>
          <div class="mt-6 flex gap-3">
            <button
              type="button"
              class="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              :disabled="loading"
              @click="emit('cancel')"
            >
              {{ cancelLabel }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              :class="danger ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'"
              :disabled="loading"
              @click="emit('confirm')"
            >
              {{ loading ? '处理中…' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
