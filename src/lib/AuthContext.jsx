import { createContext, useContext, useState, useEffect } from "react"
import { supabase, isSupabaseConfigured } from "./supabaseClient"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("genolab_user")
    return stored ? JSON.parse(stored) : null
  })
  const [initializing, setInitializing] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(toAppUser(data.session.user))
      }
      setInitializing(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAppUser(session.user) : null)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  // Supabase stores our custom "role" field inside user_metadata.
  function toAppUser(supabaseUser) {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: supabaseUser.user_metadata?.role || "technician",
    }
  }

  async function login(email, password, role) {
    if (!isSupabaseConfigured) {
      // Demo mode: accept any non-empty credentials.
      if (!email || !password) throw new Error("Enter your email and password.")
      const demoUser = { id: "demo-user", email, role: role || "technician" }
      sessionStorage.setItem("genolab_user", JSON.stringify(demoUser))
      setUser(demoUser)
      return demoUser
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const appUser = toAppUser(data.user)
    setUser(appUser)
    return appUser
  }

  async function signup(email, password, role) {
    if (!isSupabaseConfigured) {
      throw new Error("Sign up requires a connected Supabase project. Currently running in demo mode.")
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: role || "technician" } },
    })
    if (error) throw error

    // If email confirmation is enabled in the Supabase project, there's no
    // active session yet — the user must confirm via email before logging in.
    if (!data.session) {
      return { needsConfirmation: true }
    }
    const appUser = toAppUser(data.user)
    setUser(appUser)
    return { needsConfirmation: false, user: appUser }
  }

  function logout() {
    if (isSupabaseConfigured) supabase.auth.signOut()
    sessionStorage.removeItem("genolab_user")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAdmin: user?.role === "admin", initializing }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}