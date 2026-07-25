import { createContext, useContext, useState, useEffect } from "react"
import { supabase, isSupabaseConfigured } from "./supabaseClient"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("genolab_user")
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) setUser(data.session.user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

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
    const userWithRole = { ...data.user, role: role || "technician" }
    sessionStorage.setItem("genolab_user", JSON.stringify(userWithRole))
    setUser(userWithRole)
    return userWithRole
  }

  function logout() {
    if (isSupabaseConfigured) supabase.auth.signOut()
    sessionStorage.removeItem("genolab_user")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
