import { useEffect, useMemo, useState } from "react"
import { updateInventorySample, fetchInventory } from "../lib/supabaseClient"
import { BLOOD_TYPE_LIST, COLLECTION_CENTERS, RACK_LIST, SLOTS_PER_RACK_COUNT } from "../data/mockInventory"

export default function EditSampleModal({ sample, onClose, onSaved }) {
  const [inventory, setInventory] = useState([])
  const [form, setForm] = useState({
    blood_type: sample.blood_type,
    collection_center: sample.collection_center,
    date_received: sample.date_received,
    expiry_date: sample.expiry_date,
    rack: sample.rack,
    slot: sample.slot,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchInventory().then(setInventory)
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Slots occupied in the currently-selected rack, excluding this sample itself
  // (so its own current slot still shows as available to "keep").
  const slotStatusForRack = useMemo(() => {
    const map = {}
    for (const s of inventory) {
      if (s.rack === form.rack && s.status !== "expired" && s.id !== sample.id) {
        map[s.slot] = s
      }
    }
    return map
  }, [inventory, form.rack, sample.id])

  function handleRackChange(newRack) {
    // If switching rack, jump to first empty slot there (unless staying on same rack).
    if (newRack !== form.rack) {
      const occupied = {}
      for (const s of inventory) {
        if (s.rack === newRack && s.status !== "expired" && s.id !== sample.id) occupied[s.slot] = true
      }
      const firstEmpty = Array.from({ length: SLOTS_PER_RACK_COUNT }, (_, i) => i + 1).find(
        (n) => !occupied[n]
      )
      setForm((f) => ({ ...f, rack: newRack, slot: firstEmpty || f.slot }))
    }
  }

  const isMoving = form.rack !== sample.rack || form.slot !== sample.slot

  async function handleSave() {
    setSaving(true)
    setError("")
    try {
      await updateInventorySample(sample.id, form)
      onSaved()
    } catch (err) {
      setError(err.message || "Failed to update sample.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-steel-900/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-panel max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-steel-700/60 mb-1">Editing · Rack {sample.rack} · Slot {sample.slot}</p>
            <h3 className="font-mono text-lg font-semibold text-steel-900">{sample.sample_id}</h3>
          </div>
          <button onClick={onClose} className="text-steel-700/50 hover:text-steel-900 text-lg leading-none">✕</button>
        </div>

        <div className="space-y-3 mb-3">
          <label className="block">
            <span className="block text-xs font-medium text-steel-700 mb-1">Blood Type</span>
            <select value={form.blood_type} onChange={(e) => update("blood_type", e.target.value)} className="input">
              {BLOOD_TYPE_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-steel-700 mb-1">Collection Center</span>
            <select
              value={form.collection_center}
              onChange={(e) => update("collection_center", e.target.value)}
              className="input"
            >
              {COLLECTION_CENTERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-steel-700 mb-1">Date Received</span>
              <input
                type="date"
                value={form.date_received}
                onChange={(e) => update("date_received", e.target.value)}
                className="input"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-steel-700 mb-1">Expiry Date</span>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => update("expiry_date", e.target.value)}
                className="input"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-frost-100">
            <p className="text-xs font-semibold text-steel-900 mb-2">Storage Location</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-medium text-steel-700 mb-1">Rack</span>
                <select value={form.rack} onChange={(e) => handleRackChange(e.target.value)} className="input">
                  {RACK_LIST.map((r) => <option key={r} value={r}>Rack {r}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-steel-700 mb-1">Slot</span>
                <select value={form.slot} onChange={(e) => update("slot", Number(e.target.value))} className="input">
                  {Array.from({ length: SLOTS_PER_RACK_COUNT }, (_, i) => i + 1).map((n) => {
                    const occupant = slotStatusForRack[n]
                    return (
                      <option key={n} value={n} disabled={Boolean(occupant)}>
                        {occupant ? `Slot ${n} — Occupied` : `Slot ${n} — Empty`}
                      </option>
                    )
                  })}
                </select>
              </label>
            </div>
            {isMoving && (
              <p className="text-xs text-frostblue-dark mt-2">
                This will move the sample to Rack {form.rack}, Slot {form.slot}.
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-blood/10 border border-blood/30 px-3 py-2">
            <p className="text-sm text-blood-dark">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-clinical hover:bg-clinical-dark text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : isMoving ? "Move & Save" : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-frost-200 text-steel-700 text-sm font-medium py-2.5 rounded-md hover:bg-frost-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
