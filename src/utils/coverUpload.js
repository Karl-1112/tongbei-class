import { supabase } from '../supabase.js'

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

const STORAGE_ENABLED =
  import.meta.env.VITE_ENABLE_COVER_STORAGE === 'true'

/**
 * 发布时解析封面 URL
 * 默认：Base64 写入 courses.cover_url（无需 Storage 桶）
 * 仅当 .env.local 设置 VITE_ENABLE_COVER_STORAGE=true 且已创建 course-covers 桶时才走 Storage
 */
export async function resolveCoverForPublish(coverDataUrl, userId) {
  if (!coverDataUrl) return ''
  if (!coverDataUrl.startsWith('data:')) return coverDataUrl

  if (!STORAGE_ENABLED || !userId) {
    return coverDataUrl
  }

  try {
    const blob = dataUrlToBlob(coverDataUrl)
    const ext = blob.type.includes('png') ? 'png' : 'jpg'
    const safeId = String(userId).replace(/[^a-zA-Z0-9-]/g, '')
    const path = `${safeId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('course-covers')
      .upload(path, blob, { contentType: blob.type, upsert: true })

    if (uploadError) {
      console.warn('[cover] Storage 上传失败，回退 Base64:', uploadError.message)
      return coverDataUrl
    }

    const { data } = supabase.storage.from('course-covers').getPublicUrl(path)
    return data?.publicUrl || coverDataUrl
  } catch (err) {
    console.warn('[cover] Storage 异常，回退 Base64:', err?.message)
    return coverDataUrl
  }
}
