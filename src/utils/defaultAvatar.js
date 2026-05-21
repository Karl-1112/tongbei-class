/** 默认科技感头像（SVG Data URI） */
export const DEFAULT_AVATAR_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="120" y2="120">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <linearGradient id="icon" x1="40" y1="35" x2="80" y2="85">
      <stop offset="0%" stop-color="#64748b"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="60" fill="url(#bg)"/>
  <circle cx="60" cy="48" r="18" fill="url(#icon)" opacity="0.9"/>
  <path d="M30 95c4-16 18-26 30-26s26 10 30 26" fill="url(#icon)" opacity="0.85"/>
  <circle cx="60" cy="60" r="54" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4 6" opacity="0.5"/>
</svg>
`)}`

/** MVP 本地存储上限 */
export const AVATAR_MAX_BYTES = 20 * 1024 * 1024

/** 超过此大小则走 Canvas 压缩（避免 Base64 过大卡顿） */
export const AVATAR_COMPRESS_THRESHOLD = 2 * 1024 * 1024

/** 压缩后最长边（头像展示足够清晰） */
const AVATAR_MAX_EDGE = 512

const JPEG_QUALITY = 0.82

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败，请换一张试试'))
    }
    img.src = url
  })
}

/**
 * 等比例缩放并输出 JPEG Base64，减小体积
 */
export function compressImageToDataUrl(img, maxEdge = AVATAR_MAX_EDGE, quality = JPEG_QUALITY) {
  let { width, height } = img
  const longest = Math.max(width, height)
  const scale = longest > maxEdge ? maxEdge / longest : 1
  const targetW = Math.max(1, Math.round(width * scale))
  const targetH = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('浏览器不支持图片处理')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, targetW, targetH)

  return canvas.toDataURL('image/jpeg', quality)
}

async function readAndMaybeCompress(file) {
  const img = await loadImageFromFile(file)
  return compressImageToDataUrl(img)
}

/**
 * 读取用户头像：≤2MB 原图转 Base64；>2MB 自动 Canvas 压缩；最大 20MB
 */
export async function readImageAsDataUrl(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('请选择图片文件')
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error('图片请小于 20MB')
  }

  if (file.size > AVATAR_COMPRESS_THRESHOLD) {
    return readAndMaybeCompress(file)
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('图片读取失败，请换一张试试'))
    reader.readAsDataURL(file)
  })
}
