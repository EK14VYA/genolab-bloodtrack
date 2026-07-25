import { useEffect, useMemo, useState } from "react"
import AppShell from "../components/AppShell"
import EditSampleModal from "../components/EditSampleModal"
import { fetchInventory } from "../lib/supabaseClient"
import { BLOOD_TYPE_LIST } from "../data/mockInventory"
import { useAuth } from "../lib/AuthContext"

const STATUS_STYLES = {
  in_storage: "bg-clinical/10 text-clinical-dark",
  expiring_soon: "bg-amber/10 text-amber",
  expired: "bg-blood/10 text-blood-dark",
}
const STATUS_LABELS = {
  in_storage: "In Storage",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
}
const STATUS_DOT = {
  in_storage: "bg-clinical",
  expiring_soon: "bg-amber",
  expired: "bg-blood",
}

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "in_storage", label: "In Storage" },
  { key: "expiring_soon", label: "Expiring Soon" },
  { key: "expired", label: "Expired" },
]

const COLUMNS = [
  { key: "sample_id", label: "Sample ID" },
  { key: "blood_type", label: "Type" },
  { key: "collection_center", label: "Collection Center" },
  { key: "date_received", label: "Received" },
  { key: "rack", label: "Location" },
  { key: "expiry_date", label: "Expires" },
  { key: "status", label: "Status" },
]

export default function InventoryLog() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortKey, setSortKey] = useState("date_received")
  const [sortDir, setSortDir] = useState("desc")
  const [editing, setEditing] = useState(null)
  const { isAdmin } = useAuth()

  useEffect(() => {
    loadInventory()
  }, [])

  function loadInventory() {
    setLoading(true)
    fetchInventory().then((data) => {
      setInventory(data)
      setLoading(false)
    })
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const statusCounts = useMemo(() => {
    const counts = { "": inventory.length, in_storage: 0, expiring_soon: 0, expired: 0 }
    for (const s of inventory) counts[s.status] = (counts[s.status] || 0) + 1
    return counts
  }, [inventory])

  const filtered = useMemo(() => {
    let rows = inventory.filter((s) => {
      const matchesSearch =
        !search ||
        s.sample_id.toLowerCase().includes(search.toLowerCase()) ||
        s.collection_center.toLowerCase().includes(search.toLowerCase())
      const matchesType = !typeFilter || s.blood_type === typeFilter
      const matchesStatus = !statusFilter || s.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })

    rows = [...rows].sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]
      if (sortKey === "rack") {
        av = `${a.rack}-${String(a.slot).padStart(3, "0")}`
        bv = `${b.rack}-${String(b.slot).padStart(3, "0")}`
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })

    return rows
  }, [inventory, search, typeFilter, statusFilter, sortKey, sortDir])

  function exportCsv() {
    const headers = ["Sample ID", "Blood Type", "Collection Center", "Date Received", "Rack", "Slot", "Expiry Date", "Status"]
    const rows = filtered.map((s) => [
      s.sample_id, s.blood_type, s.collection_center, s.date_received, s.rack, s.slot, s.expiry_date, STATUS_LABELS[s.status],
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `genolab-inventory-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-steel-900">Inventory Log</h1>
          <p className="text-sm text-steel-700 mt-1">
            Showing {filtered.length} of {inventory.length} samples
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="text-sm font-medium text-clinical border border-clinical/30 px-3.5 py-2 rounded-md hover:bg-clinical/5 transition-colors"
        >
          Export CSV
        </button>
      </header>

      {/* Status filter tabs — more scannable than a dropdown, and shows counts at a glance */}
      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors ${
              statusFilter === tab.key
                ? "bg-steel-900 text-white"
                : "bg-white text-steel-700 border border-frost-200 hover:border-steel-700/30"
            }`}
          >
            {tab.key && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[tab.key]}`} />}
            {tab.label}
            <span className={statusFilter === tab.key ? "text-frost-200/70" : "text-steel-700/40"}>
              {statusCounts[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by Sample ID or Collection Center…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-frost-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-clinical focus:border-clinical"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-700/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-frost-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-clinical"
        >
          <option value="">All Blood Types</option>
          {BLOOD_TYPE_LIST.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-frost-100/80 text-left">
                {COLUMNS.map((col) => (
                  <Th key={col.key} sortable onClick={() => toggleSort(col.key)} active={sortKey === col.key} dir={sortDir}>
                    {col.label}
                  </Th>
                ))}
                {isAdmin && <Th>Actions</Th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-14 text-steel-700/50 text-sm">Loading inventory…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-14 text-steel-700/50 text-sm">No samples match your filters.</td></tr>
              ) : (
                filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-t border-frost-100 hover:bg-clinical/[0.03] transition-colors ${i % 2 === 1 ? "bg-frost-50/50" : ""}`}
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-steel-900 whitespace-nowrap">{s.sample_id}</td>
                    <td className="px-4 py-3.5">
                      <BloodTypeBadge type={s.blood_type} />
                    </td>
                    <td className="px-4 py-3.5 text-steel-700 max-w-[220px] truncate" title={s.collection_center}>
                      {s.collection_center}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-steel-700 whitespace-nowrap">{s.date_received}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-xs bg-frost-100 text-steel-900 px-2 py-1 rounded">
                        {s.rack}-{s.slot}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-steel-700 whitespace-nowrap">{s.expiry_date}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[s.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[s.status]}`} />
                        {STATUS_LABELS[s.status]}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => setEditing(s)}
                          className="text-xs font-medium text-clinical hover:text-clinical-dark hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditSampleModal
          sample={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            loadInventory()
          }}
        />
      )}
    </AppShell>
  )
}

function BloodTypeBadge({ type }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[38px] px-2 py-1 rounded-md text-xs font-mono font-semibold bg-blood/10 text-blood-dark border border-blood/20">
      {type}
    </span>
  )
}

function Th({ children, sortable, onClick, active, dir }) {
  return (
    <th
      onClick={sortable ? onClick : undefined}
      className={`px-4 py-3 text-[11px] font-semibold text-steel-700/70 uppercase tracking-wider ${sortable ? "cursor-pointer select-none hover:text-steel-900" : ""}`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && active && <span className="text-clinical text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>}
      </span>
    </th>
  )
}
