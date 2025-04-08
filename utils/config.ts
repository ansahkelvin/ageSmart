import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Define your Supabase URL and anon key
const supabaseUrl = 'https://lsvvxxgwelrobertaqzp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdnZ4eGd3ZWxyb2JlcnRhcXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5Njc0MDQsImV4cCI6MjA1OTU0MzQwNH0.YRZqDnKOKqSBxe3S00OJStZqL9nq_3Z9jwhhJH2UN7I'

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})

// Define database types
export type Profile = {
    id: string
    name: string
    email: string
    role: 'user' | 'caregiver'
    created_at?: string
}

// Add other types as needed