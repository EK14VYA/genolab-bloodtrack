import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import AppShell from "../components/AppShell"
import { addInventorySample, isSlotOccupied, fetchInventory } from "../lib/supabaseClient"
import { BLOOD_TYPE_LIST, COLLECTION_CENTERS, RACK_LIST, SLOTS_PER_RACK_COUNT } from "../data/mockInventory"

const SHELF_LIFE_DAYS = 42 // standard whole blood shelf life

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function AddSample() {
  const navigate = useNavigate()
  const [inventory, setInventory] = useState([])
  const [form, setForm] = useState({
    sample_id: "",
    blood_type: BLOOD_TYPE_LIST[0],
    collection_center: COLLECTION_CENTERS[0],
    date_received: todayStr(),
    expiry_date: addDays(todayStr(), SHELF_LIFE_DAYS),
    rack: RACK_LIST[0],
    slot: 1,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadInventory()
  }, [])

  function loadInventory() {
    fetchInventory().then(setInventory)
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Map of slot number -> occupying sample, for the currently selected rack.
  const slotStatusForRack = useMemo(() => {
    const map = {}
    for (const s of inventory) {
      if (s.rack === form.rack && s.status !== "expired") {
        map[s.slot] = s
      }
    }
    return map
  }, [inventory, form.rack])

  // If the currently selected slot becomes occupied (e.g. after switching racks),
  // auto-jump to the first empty slot in the new rack so the form stays valid.
  useEffect(() => {
    if (slotStatusForRack[form.slot]) {
      const firstEmpty = Array.from({ length: SLOTS_PER_RACK_COUNT }, (_, i) => i + 1).find(
        (n) => !slotStatusForRack[n]
      )
      if (firstEmpty) update("slot", firstEmpty)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.rack])

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const occupied = await isSlotOccupied(form.rack, form.slot)
      if (occupied) {
        setError(`Rack ${form.rack}, Slot ${form.slot} is already occupied. Choose another slot.`)
        setSubmitting(false)
        return
      }
      const expiry_date = form.expiry_date
      await addInventorySample({
        sample_id: form.sample_id || `GL-${Math.floor(10000 + Math.random() * 89999)}`,
        blood_type: form.blood_type,
        collection_center: form.collection_center,
        date_received: form.date_received,
        rack: form.rack,
        slot: form.slot,
        expiry_date,
      })
      setSuccess(true)
      loadInventory()
      setTimeout(() => navigate("/inventory"), 1200)
    } catch (err) {
      setError(err.message || "Failed to add sample.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell>
      <header className="mb-7">
        <h1 className="font-display text-2xl font-semibold text-steel-900">Add Sample</h1>
        <p className="text-sm text-steel-700 mt-1">Log a new incoming blood unit into storage.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-panel p-7 max-w-xl">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Sample ID (optional — auto-generated if blank)">
            <input
              type="text"
              placeholder="GL-00123"
              value={form.sample_id}
              onChange={(e) => update("sample_id", e.target.value)}
              className="input font-mono"
            />
          </Field>
          <Field label="Blood Type">
            <select value={form.blood_type} onChange={(e) => update("blood_type", e.target.value)} className="input">
              {BLOOD_TYPE_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div className="mb-4">
          <Field label="Collection Center">
            <select
              value={form.collection_center}
              onChange={(e) => update("collection_center", e.target.value)}
              className="input"
            >
              {COLLECTION_CENTERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Date Received">
            <input
              type="date"
              value={form.date_received}
              max={todayStr()}
              onChange={(e) => {
                const newDate = e.target.value
                setForm((f) => ({
                  ...f,
                  date_received: newDate,
                  // suggest a default expiry, but the field below stays editable
                  expiry_date: addDays(newDate, SHELF_LIFE_DAYS),
                }))
              }}
              className="input"
              required
            />
          </Field>
          <Field label="Expiry Date">
            <input
              type="date"
              value={form.expiry_date}
              min={form.date_received}
              onChange={(e) => update("expiry_date", e.target.value)}
              className="input"
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-2">
          <Field label="Rack">
            <select value={form.rack} onChange={(e) => update("rack", e.target.value)} className="input">
              {RACK_LIST.map((r) => <option key={r} value={r}>Rack {r}</option>)}
            </select>
          </Field>
          <Field label="Slot">
            <select value={form.slot} onChange={(e) => update("slot", Number(e.target.value))} className="input">
              {Array.from({ length: SLOTS_PER_RACK_COUNT }, (_, i) => i + 1).map((n) => {
                const occupant = slotStatusForRack[n]
                return (
                  <option key={n} value={n} disabled={Boolean(occupant)}>
                    {occupant
                      ? `Slot ${n} — Occupied (${occupant.blood_type}, expires ${occupant.expiry_date})`
                      : `Slot ${n} — Empty`}
                  </option>
                )
              })}
            </select>
          </Field>
        </div>
        <p className="text-xs text-steel-700/60 mb-6">
          Occupied slots are shown for reference but can't be selected — pick any slot marked "Empty".
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-blood/10 border border-blood/30 px-3 py-2">
            <p className="text-sm text-blood-dark">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-clinical/10 border border-clinical/30 px-3 py-2">
            <p className="text-sm text-clinical-dark">Sample logged successfully. Redirecting…</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-clinical hover:bg-clinical-dark text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-60"
        >
          {submitting ? "Logging Sample…" : "Log Sample into Storage"}
        </button>
      </form>
    </AppShell>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-steel-700 mb-1.5">{label}</span>
      {children}
    </label>
  )
}
