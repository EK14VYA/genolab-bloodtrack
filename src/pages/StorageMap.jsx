import { useEffect, useMemo, useState } from "react"
import AppShell from "../components/AppShell"
import EditSampleModal from "../components/EditSampleModal"
import { fetchInventory, discardSample, updateInventorySample } from "../lib/supabaseClient"
import { printSampleLabel } from "../lib/printLabel"
import { RACK_LIST, SLOTS_PER_RACK_COUNT } from "../data/mockInventory"
import { useAuth } from "../lib/AuthContext"

export default function StorageMap() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)
  const [draggedSample, setDraggedSample] = useState(null)
  const [dragOverKey, setDragOverKey] = useState(null)
  const [moveError, setMoveError] = useState("")
  const [moveNotice, setMoveNotice] = useState("")
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

  async function handleDiscard(sample) {
    await discardSample(sample.id)
    setSelected(null)
    loadInventory()
  }

  const slotMap = useMemo(() => {
    const map = {}
    for (const s of inventory) {
      map[`${s.rack}-${s.slot}`] = s
    }
    return map
  }, [inventory])

  function handleDragStart(sample) {
    if (!isAdmin) return
    setDraggedSample(sample)
  }

  function handleDragEnd() {
    setDraggedSample(null)
    setDragOverKey(null)
  }

  function handleDragOver(e, rack, slot) {
    if (!isAdmin || !draggedSample) return
    const key = `${rack}-${slot}`
    const occupant = slotMap[key]
    // only allow dropping onto an empty slot, or back onto its own slot
    if (!occupant || occupant.id === draggedSample.id) {
      e.preventDefault()
      setDragOverKey(key)
    }
  }

  async function handleDrop(e, rack, slot) {
    e.preventDefault()
    setDragOverKey(null)
    if (!isAdmin || !draggedSample) return
    const key = `${rack}-${slot}`
    const occupant = slotMap[key]
    if (occupant && occupant.id !== draggedSample.id) return // occupied, ignore

    if (draggedSample.rack === rack && draggedSample.slot === slot) {
      setDraggedSample(null)
      return // dropped back on itself, no-op
    }

    try {
      await updateInventorySample(draggedSample.id, { rack, slot })
      setMoveNotice(`${draggedSample.sample_id} moved to Rack ${rack}, Slot ${slot}.`)
      setTimeout(() => setMoveNotice(""), 3000)
      loadInventory()
    } catch (err) {
      setMoveError(err.message || "Failed to move sample.")
      setTimeout(() => setMoveError(""), 4000)
    }
    setDraggedSample(null)
  }

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-steel-900">Storage Map</h1>
        <p className="text-sm text-steel-700 mt-1">
          Live view of refrigerator racks. Click a slot to inspect its contents
          {isAdmin && " — or drag a sample onto an empty slot to relocate it"}.
        </p>
      </header>

      <div className="flex gap-6 mb-6 text-xs text-steel-700">
        <Legend swatch="bg-clinical" label="Occupied" />
        <Legend swatch="bg-blood pulse-warn" label="Expiring Soon" />
        <Legend swatch="bg-steel-700 border border-blood/50" label="Expired" />
        <Legend swatch="bg-frost-200 border border-steel-700/20" label="Empty" />
      </div>

      {moveNotice && (
        <div className="mb-4 rounded-md border border-clinical/30 bg-clinical/10 px-4 py-2.5">
          <p className="text-sm text-clinical-dark">{moveNotice}</p>
        </div>
      )}
      {moveError && (
        <div className="mb-4 rounded-md border border-blood/30 bg-blood/10 px-4 py-2.5">
          <p className="text-sm text-blood-dark">{moveError}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {RACK_LIST.map((rack) => (
          <div key={rack} className="bg-steel-900 rounded-xl p-5 frost-texture">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-white font-semibold text-sm tracking-wide">
                RACK {rack}
              </h3>
              <span className="text-[11px] text-frost-200/50 font-mono">
                {Object.keys(slotMap).filter((k) => k.startsWith(`${rack}-`)).length}/{SLOTS_PER_RACK_COUNT} occupied
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {Array.from({ length: SLOTS_PER_RACK_COUNT }, (_, i) => i + 1).map((slot) => {
                const sample = slotMap[`${rack}-${slot}`]
                const isExpiring = sample?.status === "expiring_soon"
                const isExpired = sample?.status === "expired"
                const isOccupied = Boolean(sample)
                const key = `${rack}-${slot}`
                const isDragOver = dragOverKey === key
                const isBeingDragged = draggedSample?.id === sample?.id

                return (
                  <button
                    key={slot}
                    draggable={isAdmin && isOccupied}
                    onDragStart={() => handleDragStart(sample)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, rack, slot)}
                    onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                    onDrop={(e) => handleDrop(e, rack, slot)}
                    onClick={() => sample && !draggedSample && setSelected(sample)}
                    disabled={!sample}
                    className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-mono font-medium transition-all
                      ${isBeingDragged ? "opacity-30 scale-95" : "hover:scale-105"}
                      ${isDragOver ? "ring-2 ring-white ring-offset-2 ring-offset-steel-900 scale-105" : ""}
                      ${isExpiring ? "bg-blood text-white pulse-warn" : isExpired ? "bg-steel-700 text-blood-light border border-blood/50" : isOccupied ? "bg-clinical text-white" : "bg-white/10 text-white/30 cursor-default"}
                      ${isAdmin && isOccupied ? "cursor-grab active:cursor-grabbing" : ""}
                    `}
                    title={sample ? `${sample.sample_id}${isAdmin ? " — drag to move" : ""}` : "Empty slot"}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-steel-700/60 mt-6">Loading storage map…</p>}

      {selected && (
        <SlotDetailModal
          sample={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onDiscard={handleDiscard}
          onEdit={() => {
            setEditing(selected)
            setSelected(null)
          }}
        />
      )}

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

function Legend({ swatch, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-sm ${swatch}`} />
      {label}
    </div>
  )
}

function SlotDetailModal({ sample, onClose, onDiscard, onEdit, isAdmin }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div
      className="fixed inset-0 bg-steel-900/60 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-panel max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-steel-700/60 mb-1">Rack {sample.rack} · Slot {sample.slot}</p>
            <h3 className="font-mono text-lg font-semibold text-steel-900">{sample.sample_id}</h3>
          </div>
          <button onClick={onClose} className="text-steel-700/50 hover:text-steel-900 text-lg leading-none">✕</button>
        </div>
        <dl className="space-y-2.5 text-sm mb-5">
          <Row label="Blood Type" value={sample.blood_type} mono accent />
          <Row label="Collection Center" value={sample.collection_center} />
          <Row label="Date Received" value={sample.date_received} mono />
          <Row label="Expiry Date" value={sample.expiry_date} mono />
          <Row label="Status" value={sample.status.replace("_", " ")} />
        </dl>

        <button
          onClick={() => printSampleLabel(sample)}
          className="w-full border border-frostblue/40 text-frostblue-dark text-sm font-medium py-2.5 rounded-md hover:bg-frostblue/5 transition-colors mb-2"
        >
          Print Label
        </button>

        {isAdmin && (
          <button
            onClick={onEdit}
            className="w-full border border-clinical/40 text-clinical-dark text-sm font-medium py-2.5 rounded-md hover:bg-clinical/5 transition-colors mb-2"
          >
            Edit Sample
          </button>
        )}

        {isAdmin && (
          !confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-full border border-blood/40 text-blood text-sm font-medium py-2.5 rounded-md hover:bg-blood/5 transition-colors"
            >
              Discard from Storage
            </button>
          ) : (
            <div className="rounded-md border border-blood/30 bg-blood/5 p-3">
              <p className="text-sm text-blood-dark mb-3">
                This frees Rack {sample.rack}, Slot {sample.slot}. This can't be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onDiscard(sample)}
                  className="flex-1 bg-blood text-white text-sm font-medium py-2 rounded-md hover:bg-blood-dark transition-colors"
                >
                  Confirm Discard
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 border border-frost-200 text-steel-700 text-sm font-medium py-2 rounded-md hover:bg-frost-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        )}

        {!isAdmin && (
          <p className="text-xs text-steel-700/50 text-center mt-2">
            Editing and discarding requires Admin access.
          </p>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, mono, accent }) {
  return (
    <div className="flex items-center justify-between border-b border-frost-100 pb-2">
      <dt className="text-steel-700/60">{label}</dt>
      <dd className={`${mono ? "font-mono" : ""} ${accent ? "text-blood font-semibold" : "text-steel-900"} capitalize`}>
        {value}
      </dd>
    </div>
  )
}
