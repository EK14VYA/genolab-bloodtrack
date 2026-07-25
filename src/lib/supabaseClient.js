import { createClient } from "@supabase/supabase-js"
import { MOCK_INVENTORY } from "../data/mockInventory"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// If real Supabase credentials aren't provided in .env, the app runs on
// mock data instead. This means the demo NEVER breaks, even without a
// live database connection during evaluation.
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

const MOCK_STORAGE_KEY = "genolab_mock_inventory_v1"

// Mock data is persisted to localStorage so that adding, moving, editing, or
// discarding samples survives a page refresh instead of resetting to a fresh
// random layout every time. This only applies in demo mode (no Supabase).
function loadMockStore() {
  try {
    const saved = localStorage.getItem(MOCK_STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // fall through to fresh seed data if storage is unavailable/corrupted
  }
  return [...MOCK_INVENTORY]
}

function saveMockStore() {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockStore))
  } catch {
    // storage full or unavailable — data just won't persist this session
  }
}

let mockStore = loadMockStore()

// Resets demo data back to the original randomly-generated seed layout,
// clearing any adds/moves/edits/discards made during this demo session.
export function resetMockData() {
  mockStore = [...MOCK_INVENTORY]
  saveMockStore()
}

function recalcStatus(expiry_date) {
  const today = new Date()
  const exp = new Date(expiry_date)
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return "expired"
  if (diffDays <= 5) return "expiring_soon"
  return "in_storage"
}

export async function fetchInventory() {
  if (!isSupabaseConfigured) {
    return mockStore.map((s) => ({ ...s, status: recalcStatus(s.expiry_date) }))
  }
  const { data, error } = await supabase
    .from("blood_inventory")
    .select("*")
    .order("date_received", { ascending: false })
  if (error) throw error
  return data
}

export async function addInventorySample(sample) {
  if (!isSupabaseConfigured) {
    const newSample = {
      id: Date.now(),
      ...sample,
      status: recalcStatus(sample.expiry_date),
    }
    mockStore = [newSample, ...mockStore]
    saveMockStore()
    return newSample
  }
  const { data, error } = await supabase
    .from("blood_inventory")
    .insert([sample])
    .select()
  if (error) throw error
  return data[0]
}

export async function isSlotOccupied(rack, slot) {
  const inventory = await fetchInventory()
  return inventory.some(
    (s) => s.rack === rack && String(s.slot) === String(slot) && s.status !== "expired"
  )
}

export async function discardSample(id) {
  if (!isSupabaseConfigured) {
    mockStore = mockStore.filter((s) => s.id !== id)
    saveMockStore()
    return true
  }
  const { error } = await supabase.from("blood_inventory").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function updateInventorySample(id, updates) {
  if (!isSupabaseConfigured) {
    mockStore = mockStore.map((s) => (s.id === id ? { ...s, ...updates } : s))
    saveMockStore()
    return mockStore.find((s) => s.id === id)
  }
  const { data, error } = await supabase
    .from("blood_inventory")
    .update(updates)
    .eq("id", id)
    .select()
  if (error) throw error
  return data[0]
}
