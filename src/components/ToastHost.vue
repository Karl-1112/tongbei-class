<script setup>
import { useToast } from '../composables/useToast.js'

const { visible, message, type } = useToast()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="visible"
        class="fixed left-1/2 top-6 z-[80] -translate-x-1/2"
        role="status"
      >
        <div
          class="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-xl"
          :class="
            type === 'error'
              ? 'bg-red-500 shadow-red-500/30'
              : 'bg-emerald-500 shadow-emerald-500/30'
          "
        >
          <span v-if="type === 'success'">✓</span>
          <span v-else>!</span>
          {{ message }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
