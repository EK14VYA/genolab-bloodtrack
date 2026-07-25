import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../lib/AuthContext"
import { resetMockData, isSupabaseConfigured } from "../lib/supabaseClient"

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/inventory", label: "Inventory Log", icon: TableIcon },
  { to: "/storage-map", label: "Storage Map", icon: GridIcon },
  { to: "/add-sample", label: "Add Sample", icon: PlusIcon },
]

export default function AppShell({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  function handleReset() {
    if (confirm("Reset demo data to its original layout? This clears any changes made during this session.")) {
      resetMockData()
      window.location.reload()
    }
  }

  const navItems = NAV_ITEMS.filter((item) => item.to !== "/add-sample" || isAdmin)

  return (
    <div className="min-h-screen flex bg-frost-50">
      <aside className="w-64 shrink-0 bg-steel-900 text-frost-50 flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <LogoMark />
            <div>
              <p className="font-display font-semibold tracking-tight leading-none">Genolab</p>
              <p className="text-[11px] text-frost-200/70 tracking-widest uppercase mt-1">BloodTrack</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-clinical text-white"
                    : "text-frost-200/80 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          {!isSupabaseConfigured && isAdmin && (
            <button
              onClick={handleReset}
              className="w-full mb-3 text-xs text-frost-200/60 border border-white/10 px-2.5 py-1.5 rounded hover:bg-white/5 hover:text-white transition-colors"
            >
              Reset Demo Data
            </button>
          )}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-frost-200/60">
                Signed in as <span className={isAdmin ? "text-clinical-light" : "text-frost-200/60"}>{isAdmin ? "Admin" : "Technician"}</span>
              </p>
              <p className="text-sm font-medium truncate">{user?.email ?? "Staff"}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs px-2.5 py-1.5 rounded border border-white/15 text-frost-200/80 hover:bg-white/5 hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  )
}

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <path
        d="M15 3C15 3 6 13.5 6 19.5C6 24.194 10.03 28 15 28C19.97 28 24 24.194 24 19.5C24 13.5 15 3 15 3Z"
        fill="#C0293B"
      />
      <path
        d="M15 3C15 3 6 13.5 6 19.5C6 24.194 10.03 28 15 28"
        stroke="#0F8B8D"
        strokeWidth="0"
      />
      <circle cx="12" cy="20" r="2.2" fill="white" fillOpacity="0.55" />
    </svg>
  )
}

function DashboardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}
function TableIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="4" x2="9" y2="20" />
    </svg>
  )
}
function GridIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="10" y="3" width="5" height="5" rx="1" />
      <rect x="17" y="3" width="4" height="5" rx="1" />
      <rect x="3" y="10" width="5" height="5" rx="1" />
      <rect x="10" y="10" width="5" height="5" rx="1" />
      <rect x="17" y="10" width="4" height="5" rx="1" />
      <rect x="3" y="17" width="5" height="4" rx="1" />
      <rect x="10" y="17" width="5" height="4" rx="1" />
    </svg>
  )
}
function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
