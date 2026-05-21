<script setup>
defineEmits(['create'])
</script>

<template>
  <div
    class="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white px-8 py-20 text-center"
  >
    <div
      class="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 text-5xl shadow-inner"
    >
      📚
    </div>
    <h3 class="text-xl font-bold text-slate-800">
      暂无课程，等待第一批学长破局入伙…
    </h3>
    <p class="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
      全站课程由创作者学长在云端真实发布。成为创作者，点击即可创建第一门课。
    </p>
    <slot />
  </div>
</template>
