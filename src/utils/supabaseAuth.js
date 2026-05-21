import { supabase } from '../supabase.js'

/** 登录 / 注册错误转中文提示 */
export function formatAuthError(err) {
  const msg = (err?.message || String(err)).toLowerCase()
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return '邮箱或密码错误；新用户请直接点登录，系统会自动注册'
  }
  if (msg.includes('already registered') || msg.includes('user already registered')) {
    return '该邮箱已注册，请检查密码后登录'
  }
  if (msg.includes('email not confirmed')) {
    return '请在 Supabase 后台关闭邮箱确认：Authentication → Email → 关闭 Confirm email'
  }
  if (msg.includes('rate limit')) {
    return '请求过于频繁，请稍后再试'
  }
  if (msg.includes('password')) {
    return err.message || '密码不符合要求（至少 6 位）'
  }
  if (msg.includes('valid email')) {
    return '请输入有效的电子邮箱'
  }
  return err?.message || '登录失败，请稍后重试'
}

/**
 * 邮箱 + 密码：老用户直接登录，新用户自动注册（不发验证码邮件）
 */
export async function signInOrSignUpWithEmail(email, password) {
  const normalized = email.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('请输入有效的电子邮箱')
  }
  if (!password || password.length < 6) {
    throw new Error('密码至少 6 位')
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    })

  if (!signInError && signInData.user) {
    return { user: signInData.user, isNewUser: false }
  }

  const signInMsg = (signInError?.message || '').toLowerCase()

  if (
    signInMsg.includes('invalid login') ||
    signInMsg.includes('invalid credentials') ||
    signInMsg.includes('user not found')
  ) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: { email: normalized },
      },
    })

    if (signUpError) {
      if (
        signUpError.message.toLowerCase().includes('already') ||
        signUpError.message.toLowerCase().includes('registered')
      ) {
        throw new Error('该邮箱已注册，请检查密码后重新登录')
      }
      throw signUpError
    }

    if (signUpData.session?.user) {
      return { user: signUpData.user, isNewUser: true }
    }

    if (signUpData.user) {
      const retry = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      })
      if (!retry.error && retry.data.user) {
        return { user: retry.data.user, isNewUser: true }
      }
      throw new Error(
        '注册成功但无法自动登录：请在 Supabase → Authentication → Email 关闭「Confirm email」'
      )
    }
  }

  throw signInError || new Error('登录失败')
}

/** 从 profiles 表拉取档案 */
export async function fetchProfileForUser(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** 使用当前 Supabase 会话（邮箱登录后应已有 session） */
export async function ensureSupabaseSession(authState = null) {
  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData.session?.user
  if (!user) {
    throw new Error('请先使用邮箱和密码登录')
  }
  if (authState) await syncProfileToSupabase(user, authState)
  return user
}

/** 将本地档案同步到 profiles 表 */
export async function syncProfileToSupabase(user, authState) {
  if (!user?.id || !authState) return

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      phone: authState.phone || null,
      nickname: authState.nickname || '',
      avatar_url: authState.avatar || '',
      points: authState.points ?? 500,
      role: authState.role || 'student',
      creator_profile_id: authState.creatorProfileId || null,
    },
    { onConflict: 'id' }
  )

  if (error) throw error
}

export async function signOutSupabase() {
  await supabase.auth.signOut()
}
