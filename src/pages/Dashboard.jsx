import { useEffect, useMemo, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"
import AppShell from "../components/AppShell"
import { fetchInventory } from "../lib/supabaseClient"

const PIE_COLORS = ["#0F8B8D", "#4A90A4", "#C0293B", "#D98E04", "#6FB8BA", "#8F1D2C", "#7FB3C4", "#3C4A56"]
const LOW_STOCK_THRESHOLD = 3

const RANGE_OPTIONS = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "all", label: "All Time" },
]

export default function Dashboard() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState("all")
  const [alertSent, setAlertSent] = useState(false)

  useEffect(() => {
    fetchInventory().then((data) => {
      setInventory(data)
      setLoading(false)
    })
  }, [])

  const rangedInventory = useMemo(() => {
    if (range === "all") return inventory
    const days = range === "7d" ? 7 : 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return inventory.filter((s) => new Date(s.date_received) >= cutoff)
  }, [inventory, range])

  const stats = useMemo(() => {
    const total = rangedInventory.length
    const expiringSoon = rangedInventory.filter((s) => s.status === "expiring_soon").length
    const expired = rangedInventory.filter((s) => s.status === "expired").length
    const byType = {}
    for (const s of rangedInventory) {
      byType[s.blood_type] = (byType[s.blood_type] || 0) + 1
    }
    const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }))
    const lowStockTypes = Object.entries(byType)
      .filter(([, count]) => count < LOW_STOCK_THRESHOLD)
      .map(([type]) => type)
    return { total, expiringSoon, expired, pieData, byType, lowStockTypes }
  }, [rangedInventory])

  const expiringList = useMemo(
    () => rangedInventory.filter((s) => s.status === "expiring_soon").slice(0, 5),
    [rangedInventory]
  )

  function handleSendAlert() {
    setAlertSent(true)
    setTimeout(() => setAlertSent(false), 4000)
  }

  return (
    <AppShell>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-steel-900">Dashboard</h1>
          <p className="text-sm text-steel-700 mt-1">Real-time overview of blood sample inventory.</p>
        </div>
        <div className="flex gap-1 bg-white rounded-lg shadow-panel p-1 border border-frost-200">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors ${
                range === opt.key ? "bg-clinical text-white" : "text-steel-700 hover:bg-frost-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-3 mb-6">
        {!loading && stats.expiringSoon > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-blood/20 bg-blood/[0.04] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blood/10 shrink-0">
                <span className="w-2 h-2 rounded-full bg-blood pulse-warn" />
              </span>
              <p className="text-sm text-steel-900">
                <span className="font-semibold text-blood-dark">{stats.expiringSoon} unit{stats.expiringSoon !== 1 ? "s" : ""}</span>{" "}
                expiring within 5 days — check the Storage Map to locate them.
              </p>
            </div>
            <button
              onClick={handleSendAlert}
              className="shrink-0 text-xs font-medium text-blood-dark bg-white border border-blood/25 px-3 py-1.5 rounded-md hover:bg-blood/5 transition-colors"
            >
              {alertSent ? "Alert Sent ✓" : "Send Alert Email"}
            </button>
          </div>
        )}

        {!loading && stats.lowStockTypes.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber/25 bg-amber/[0.06] px-4 py-3.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber/15 shrink-0">
              <span className="w-2 h-2 rounded-full bg-amber" />
            </span>
            <p className="text-sm text-steel-900">
              Low stock warning: <span className="font-semibold" style={{ color: "#8a5c03" }}>{stats.lowStockTypes.join(", ")}</span> below {LOW_STOCK_THRESHOLD} units.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Units in Storage"
          value={loading ? "—" : stats.total}
          accent="clinical"
          icon={<DropIcon />}
        />
        <StatCard
          label="Expiring Soon"
          sublabel="within 5 days"
          value={loading ? "—" : stats.expiringSoon}
          accent="blood"
          icon={<ClockIcon />}
        />
        <StatCard
          label="Expired"
          sublabel="flagged for removal"
          value={loading ? "—" : stats.expired}
          accent="steel"
          icon={<AlertIcon />}
        />
      </div>

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 bg-white rounded-xl shadow-panel p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-sm font-semibold text-steel-900">
              Blood Type Distribution
            </h2>
            {!loading && stats.pieData.length > 0 && (
              <span className="text-xs text-steel-700/50">{stats.pieData.length} types in stock</span>
            )}
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-steel-700/50">Loading…</div>
          ) : stats.pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-steel-700/50">No data in this range.</div>
          ) : (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie
                  data={stats.pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                >
                  {stats.pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #EAEEF0", fontSize: 13 }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(value) => <span style={{ color: "#28333D" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-2 bg-white rounded-xl shadow-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-semibold text-steel-900">Expiring Soon</h2>
            {!loading && expiringList.length > 0 && (
              <span className="text-xs font-medium text-blood bg-blood/10 px-2 py-0.5 rounded-full">
                {expiringList.length}
              </span>
            )}
          </div>
          {loading ? (
            <p className="text-sm text-steel-700/50">Loading…</p>
          ) : expiringList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-clinical/10 mb-3">
                <CheckIcon />
              </span>
              <p className="text-sm text-steel-700/60">No units expiring in the next 5 days.</p>
            </div>
          ) : (
            <ul className="divide-y divide-frost-100">
              {expiringList.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blood pulse-warn shrink-0" />
                    <div>
                      <p className="font-mono text-sm text-steel-900">{s.sample_id}</p>
                      <p className="text-xs text-steel-700/50 mt-0.5">
                        {s.rack}-{s.slot} · {s.blood_type}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-blood-dark bg-blood/10 px-2 py-1 rounded">
                    {s.expiry_date}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ label, sublabel, value, accent, icon }) {
  const accentClasses = {
    clinical: { text: "text-clinical", bg: "bg-clinical/10" },
    blood: { text: "text-blood", bg: "bg-blood/10" },
    steel: { text: "text-steel-700", bg: "bg-steel-700/10" },
  }
  const c = accentClasses[accent]
  return (
    <div className="bg-white rounded-xl shadow-panel p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-steel-700/70">{label}</p>
        <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${c.bg} ${c.text} shrink-0`}>
          {icon}
        </span>
      </div>
      <p className={`font-display text-3xl font-semibold ${c.text}`}>{value}</p>
      {sublabel && <p className="text-xs text-steel-700/40 mt-1">{sublabel}</p>}
    </div>
  )
}

function DropIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 2 5 11 5 16a7 7 0 0014 0c0-5-7-14-7-14z" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F8B8D" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
