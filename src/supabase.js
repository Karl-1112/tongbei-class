import { createClient } from '@supabase/supabase-js'

/**
 * 规范 Supabase 项目 URL（仅项目根地址，不要带 /rest/v1/）
 * 正确示例：https://xxxx.supabase.co
 */
export function normalizeSupabaseUrl(url) {
  let u = (url || '').trim()
  // 从 API 设置页误复制的 REST 地址
  u = u.replace(/\/rest\/v1\/?$/i, '')
  return u.replace(/\/+$/, '')
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[同辈课栈] 未配置 Supabase：请在项目根目录创建 .env.local，并填写 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY'
  )
}

/**
 * Supabase 客户端单例（浏览器端使用 anon key）
 * 文档：https://supabase.com/docs/reference/javascript/introduction
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
