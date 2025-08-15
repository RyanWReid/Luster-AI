import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client component helper
export const createClientSupabase = () => createClientComponentClient()

// Server component helper
export const createServerSupabase = () => createServerComponentClient({ cookies })

// Auth helpers
export const signInWithEmail = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// Storage helpers
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string
    contentType?: string
    upsert?: boolean
  }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, options)
  
  return { data, error }
}

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

export const createSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  
  return { data, error }
}

export const deleteFile = async (bucket: string, paths: string[]) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove(paths)
  
  return { data, error }
}

// Database helpers
export const insertRecord = async <T>(
  table: string,
  data: Partial<T>
) => {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single()
  
  return { data: result, error }
}

export const updateRecord = async <T>(
  table: string,
  id: string,
  data: Partial<T>
) => {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()
  
  return { data: result, error }
}

export const deleteRecord = async (table: string, id: string) => {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
  
  return { error }
}

export const getRecord = async <T>(
  table: string,
  id: string
) => {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()
  
  return { data: data as T, error }
}

export const getRecords = async <T>(
  table: string,
  query?: {
    select?: string
    eq?: { column: string; value: any }
    order?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  }
) => {
  let queryBuilder = supabase.from(table).select(query?.select || '*')
  
  if (query?.eq) {
    queryBuilder = queryBuilder.eq(query.eq.column, query.eq.value)
  }
  
  if (query?.order) {
    queryBuilder = queryBuilder.order(query.order.column, {
      ascending: query.order.ascending ?? true
    })
  }
  
  if (query?.limit) {
    queryBuilder = queryBuilder.limit(query.limit)
  }
  
  if (query?.offset) {
    queryBuilder = queryBuilder.range(query.offset, query.offset + (query?.limit || 10) - 1)
  }
  
  const { data, error } = await queryBuilder
  
  return { data: data as T[], error }
}