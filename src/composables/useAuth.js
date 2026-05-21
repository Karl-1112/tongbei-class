import { ref, computed } from 'vue'
import {
  DEFAULT_STUDENT_POINTS,
  DEMO_CREATOR_ID,
} from '../utils/pricing.js'
import { DEFAULT_AVATAR_SVG } from '../utils/defaultAvatar.js'
import {
  signInOrSignUpWithEmail,
  fetchProfileForUser,
  syncProfileToSupabase,
  ensureSupabaseSession,
  signOutSupabase,
  formatAuthError,
} from '../utils/supabaseAuth.js'
import { supabase } from '../supabase.js'

const STORAGE_KEY = 'peer-course-auth'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

const authState = ref(ensureStudentPoints(loadFromStorage()))

function persist() {
  if (authState.value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authState.value))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function ensureStudentPoints(state) {
  if (!state) return state
  const pts = state.points ?? DEFAULT_STUDENT_POINTS
  return {
    ...state,
    points: pts < DEFAULT_STUDENT_POINTS ? DEFAULT_STUDENT_POINTS : pts,
  }
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return ''
  const [name, domain] = email.split('@')
  const head = name.length <= 2 ? name[0] || '*' : name.slice(0, 2)
  return `${head}***@${domain}`
}

function buildAuthFromProfile(user, profile, saved) {
  const base = {
    email: user.email,
    supabaseUserId: user.id,
    phone: profile?.phone || saved?.phone || '',
    points: profile?.points ?? saved?.points ?? DEFAULT_STUDENT_POINTS,
    nickname: profile?.nickname || saved?.nickname || '',
    avatar: profile?.avatar_url || saved?.avatar || '',
    role: profile?.role || saved?.role || null,
    creatorProfileId:
      profile?.creator_profile_id ||
      saved?.creatorProfileId ||
      DEMO_CREATOR_ID,
  }
  return ensureStudentPoints(base)
}

async function syncIfSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user && authState.value) {
    await syncProfileToSupabase(session.user, authState.value)
  }
}

/** 刷新页面后恢复 Supabase 会话与本地状态 */
async function hydrateFromSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return

  const profile = await fetchProfileForUser(session.user.id).catch(() => null)
  const saved = loadFromStorage()

  if (profile || saved?.supabaseUserId === session.user.id || saved?.email === session.user.email) {
    authState.value = buildAuthFromProfile(session.user, profile, saved)
    persist()
  }
}

if (typeof window !== 'undefined') {
  hydrateFromSession().catch(() => {})
}

export function useAuth() {
  const isLoggedIn = computed(
    () => Boolean(authState.value?.supabaseUserId || authState.value?.email)
  )

  const userKey = computed(
    () => authState.value?.supabaseUserId || authState.value?.email || ''
  )

  const role = computed(() => authState.value?.role ?? null)

  const nickname = computed(() => authState.value?.nickname?.trim() ?? '')

  const avatar = computed(() => authState.value?.avatar ?? '')

  const displayAvatar = computed(() => avatar.value || DEFAULT_AVATAR_SVG)

  const needsProfile = computed(() => isLoggedIn.value && !nickname.value)

  const needsIdentity = computed(() => isLoggedIn.value && !authState.value?.role)

  const points = computed(() => authState.value?.points ?? 0)

  const email = computed(() => authState.value?.email ?? '')

  /** @deprecated 保留兼容；commerce 请用 userKey */
  const phone = computed(() => authState.value?.phone ?? userKey.value)

  const creatorProfileId = computed(
    () => authState.value?.creatorProfileId ?? DEMO_CREATOR_ID
  )

  const emailMasked = computed(() => maskEmail(authState.value?.email))

  const phoneMasked = computed(() => emailMasked.value)

  const displayName = computed(
    () => nickname.value || emailMasked.value || '同辈学员'
  )

  const identityLabel = computed(() => {
    if (role.value === 'student') return '学生'
    if (role.value === 'creator') return '创作者'
    return '未选择'
  })

  const avatarText = computed(() => {
    if (nickname.value) return nickname.value.charAt(0)
    if (role.value === 'creator') return '创'
    if (role.value === 'student') return '学'
    return '我'
  })

  /** 邮箱 + 密码登录（新用户自动注册） */
  async function loginWithEmail(emailAddress, password) {
    const { user, isNewUser } = await signInOrSignUpWithEmail(emailAddress, password)

    let profile = null
    try {
      profile = await fetchProfileForUser(user.id)
    } catch {
      profile = null
    }

    const saved = loadFromStorage()

    if (profile) {
      authState.value = buildAuthFromProfile(user, profile, saved)
    } else if (saved?.email === user.email || saved?.supabaseUserId === user.id) {
      authState.value = ensureStudentPoints({
        ...saved,
        email: user.email,
        supabaseUserId: user.id,
      })
    } else {
      authState.value = ensureStudentPoints({
        email: user.email,
        supabaseUserId: user.id,
        phone: '',
        points: DEFAULT_STUDENT_POINTS,
        role: null,
        nickname: '',
        avatar: '',
        creatorProfileId: `creator_${user.id.slice(0, 8)}`,
      })
    }

    persist()
    await syncProfileToSupabase(user, authState.value)
    return { isNewUser }
  }

  async function setProfile({ nickname: nick, avatar: av }) {
    if (!authState.value) return
    authState.value = {
      ...authState.value,
      nickname: nick.trim(),
      avatar: av || '',
    }
    persist()
    await syncIfSession()
  }

  async function setRole(newRole) {
    if (!authState.value) return
    let nextCreatorId = authState.value.creatorProfileId
    if (newRole === 'creator' && !nextCreatorId) {
      const uid = authState.value.supabaseUserId || ''
      nextCreatorId = uid ? `creator_${uid.slice(0, 8)}` : DEMO_CREATOR_ID
    }
    authState.value = {
      ...authState.value,
      role: newRole,
      creatorProfileId: nextCreatorId,
    }
    persist()
    await syncIfSession()
  }

  async function switchRole() {
    if (!authState.value?.role) return
    const next = authState.value.role === 'student' ? 'creator' : 'student'
    await setRole(next)
  }

  function deductPoints(amount) {
    if (!authState.value || amount <= 0) return false
    if (authState.value.points < amount) return false
    authState.value = {
      ...authState.value,
      points: authState.value.points - amount,
    }
    persist()
    syncIfSession().catch(() => {})
    return true
  }

  function addPoints(amount) {
    if (!authState.value || amount <= 0) return
    authState.value = {
      ...authState.value,
      points: authState.value.points + amount,
    }
    persist()
    syncIfSession().catch(() => {})
  }

  async function logout() {
    try {
      await signOutSupabase()
    } catch {
      /* ignore */
    }
    authState.value = null
    persist()
  }

  async function bindSupabase() {
    if (!authState.value) return null
    try {
      const user = await ensureSupabaseSession(authState.value)
      authState.value = {
        ...authState.value,
        supabaseUserId: user.id,
        email: user.email || authState.value.email,
      }
      persist()
      return user
    } catch (err) {
      console.error('[bindSupabase]', err)
      throw err
    }
  }

  const supabaseUserId = computed(() => authState.value?.supabaseUserId ?? null)

  return {
    authState,
    isLoggedIn,
    userKey,
    role,
    nickname,
    avatar,
    displayAvatar,
    displayName,
    needsProfile,
    needsIdentity,
    points,
    email,
    phone,
    phoneMasked,
    emailMasked,
    creatorProfileId,
    identityLabel,
    avatarText,
    loginWithEmail,
    formatAuthError,
    setProfile,
    setRole,
    switchRole,
    deductPoints,
    addPoints,
    logout,
    bindSupabase,
    supabaseUserId,
  }
}
