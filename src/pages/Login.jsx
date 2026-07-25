import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../lib/AuthContext"
import { isSupabaseConfigured } from "../lib/supabaseClient"

export default function Login() {
  const [mode, setMode] = useState("signin") // "signin" | "signup"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("technician")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  function switchMode(newMode) {
    setMode(newMode)
    setError("")
    setNotice("")
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setNotice("")
    setLoading(true)
    try {
      if (mode === "signup") {
        const result = await signup(email, password, role)
        if (result.needsConfirmation) {
          setNotice("Account created — check your email to confirm before signing in.")
          setMode("signin")
        } else {
          navigate("/dashboard")
        }
      } else {
        await login(email, password, role)
        navigate("/dashboard")
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-steel-900 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <svg width="44" height="44" viewBox="0 0 30 30" fill="none" className="mb-3">
            <path
              d="M15 3C15 3 6 13.5 6 19.5C6 24.194 10.03 28 15 28C19.97 28 24 24.194 24 19.5C24 13.5 15 3 15 3Z"
              fill="#C0293B"
            />
            <circle cx="12" cy="20" r="2.2" fill="white" fillOpacity="0.55" />
          </svg>
          <h1 className="font-display text-2xl font-semibold text-white tracking-tight">Genolab</h1>
          <p className="text-frost-200/60 text-xs tracking-widest uppercase mt-1">BloodTrack</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-frost-50 rounded-xl shadow-panel px-7 py-8">
          <div className="flex mb-6 bg-frost-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                mode === "signin" ? "bg-white text-steel-900 shadow-sm" : "text-steel-700/60"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                mode === "signup" ? "bg-white text-steel-900 shadow-sm" : "text-steel-700/60"
              }`}
            >
              Create Account
            </button>
          </div>

          <h2 className="font-display text-lg font-semibold text-steel-900 mb-1">
            {mode === "signin" ? "Staff Sign In" : "Create Staff Account"}
          </h2>
          <p className="text-sm text-steel-700 mb-6">
            {mode === "signin"
              ? "Access the inventory & storage dashboard."
              : "Register as new lab staff to get access."}
          </p>

          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-md bg-amber/10 border border-amber/30 px-3 py-2">
              <p className="text-xs text-amber-700" style={{ color: "#8a5c03" }}>
                {mode === "signup"
                  ? "Account creation requires a connected database — not available in this demo instance."
                  : "Running in demo mode — enter any email & password to continue."}
              </p>
            </div>
          )}

          <label className="block text-xs font-medium text-steel-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@genolab.com"
            className="w-full mb-4 px-3 py-2.5 rounded-md border border-frost-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-clinical focus:border-clinical"
          />

          <label className="block text-xs font-medium text-steel-700 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? 6 : undefined}
            placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
            className="w-full mb-4 px-3 py-2.5 rounded-md border border-frost-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-clinical focus:border-clinical"
          />

          <label className="block text-xs font-medium text-steel-700 mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full mb-5 px-3 py-2.5 rounded-md border border-frost-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-clinical focus:border-clinical"
          >
            <option value="technician">Lab Technician (view only)</option>
            <option value="admin">Admin (full access)</option>
          </select>

          {error && <p className="text-sm text-blood mb-4">{error}</p>}
          {notice && <p className="text-sm text-clinical-dark mb-4">{notice}</p>}

          <button
            type="submit"
            disabled={loading || (mode === "signup" && !isSupabaseConfigured)}
            className="w-full bg-clinical hover:bg-clinical-dark text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-60"
          >
            {loading
              ? mode === "signin" ? "Signing in…" : "Creating account…"
              : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-frost-200/50 mt-6">
          Genolab Internal Systems · Sample Custody &amp; Storage
        </p>
      </div>
    </div>
  )
}