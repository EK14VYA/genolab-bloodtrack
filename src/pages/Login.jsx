import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../lib/AuthContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("technician")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password, role)
      navigate("/dashboard")
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.")
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
          <h2 className="font-display text-lg font-semibold text-steel-900 mb-1">Staff Sign In</h2>
          <p className="text-sm text-steel-700 mb-6">Access the inventory &amp; storage dashboard.</p>

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
            placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-clinical hover:bg-clinical-dark text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-frost-200/50 mt-6">
          Genolab Internal Systems · Sample Custody &amp; Storage
        </p>
      </div>
    </div>
  )
}
