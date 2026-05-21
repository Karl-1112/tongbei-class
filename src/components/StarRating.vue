<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
})

const emit = defineEmits(['update:modelValue'])

const hoverValue = ref(0)

const displayValue = computed(() =>
  props.readonly ? props.modelValue : hoverValue.value || props.modelValue
)

const sizeClass = computed(() =>
  props.size === 'lg' ? 'h-8 w-8 text-3xl' : props.size === 'sm' ? 'h-5 w-5 text-lg' : 'h-7 w-7 text-2xl'
)

watch(
  () => props.modelValue,
  () => {
    hoverValue.value = 0
  }
)

function setRating(n) {
  if (props.readonly) return
  emit('update:modelValue', n)
}

function onMouseLeave() {
  hoverValue.value = 0
}
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5"
    role="img"
    :aria-label="readonly ? `评分 ${modelValue} 星` : '选择评分'"
    @mouseleave="onMouseLeave"
  >
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="transition-transform focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 rounded"
      :class="[
        sizeClass,
        readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
        n <= displayValue ? 'text-amber-400' : 'text-slate-200',
      ]"
      :disabled="readonly"
      :aria-label="`${n} 星`"
      @click="setRating(n)"
      @mouseenter="!readonly && (hoverValue = n)"
    >
      ★
    </button>
  </div>
</template>
