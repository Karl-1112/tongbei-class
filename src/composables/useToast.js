import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const type = ref('success')
let hideTimer = null

export function useToast() {
  function show(msg, toastType = 'success', duration = 2600) {
    message.value = msg
    type.value = toastType
    visible.value = true
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
      visible.value = false
    }, duration)
  }

  return { visible, message, type, show }
}
