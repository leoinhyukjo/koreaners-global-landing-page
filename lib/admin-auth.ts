import { supabase } from './supabase/client'

// 클라이언트 사이드: 현재 세션 확인
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// 클라이언트 사이드: 로그인
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// 클라이언트 사이드: 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}
