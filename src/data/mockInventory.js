// Mock inventory data — used automatically when Supabase env vars aren't set,
// so the app is always demoable (e.g. during evaluation) even offline.

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
const CENTERS = [
  "City General Hospital",
  "Red Cross Center - Sector 4",
  "St. Mary's Blood Bank",
  "Genolab Mobile Camp",
  "District Health Center",
]

const RACKS = ["A", "B", "C", "D"]
const SLOTS_PER_RACK = 12

function randomDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo))
  return d.toISOString().slice(0, 10)
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function statusFor(expiryDate) {
  const today = new Date()
  const exp = new Date(expiryDate)
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return "expired"
  if (diffDays <= 5) return "expiring_soon"
  return "in_storage"
}

function generateMockInventory() {
  const samples = []
  const occupiedSlots = new Set()
  let id = 1

  for (const rack of RACKS) {
    const occupiedCount = Math.floor(SLOTS_PER_RACK * (0.5 + Math.random() * 0.4))
    const slotNumbers = Array.from({ length: SLOTS_PER_RACK }, (_, i) => i + 1)
    for (let i = slotNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[slotNumbers[i], slotNumbers[j]] = [slotNumbers[j], slotNumbers[i]]
    }
    const chosen = slotNumbers.slice(0, occupiedCount)

    for (const slot of chosen) {
      const dateReceived = randomDate(35)
      const shelfLifeDays = 42 // whole blood standard shelf life
      const expiryDate = addDays(dateReceived, shelfLifeDays)
      const bloodType = BLOOD_TYPES[Math.floor(Math.random() * BLOOD_TYPES.length)]
      const center = CENTERS[Math.floor(Math.random() * CENTERS.length)]
      const key = `${rack}-${slot}`
      occupiedSlots.add(key)

      samples.push({
        id: id++,
        sample_id: `GL-${String(2000 + id).padStart(5, "0")}`,
        blood_type: bloodType,
        collection_center: center,
        date_received: dateReceived,
        rack,
        slot,
        expiry_date: expiryDate,
        status: statusFor(expiryDate),
      })
    }
  }

  return samples.sort((a, b) => new Date(b.date_received) - new Date(a.date_received))
}

export const MOCK_INVENTORY = generateMockInventory()
export const RACK_LIST = RACKS
export const SLOTS_PER_RACK_COUNT = SLOTS_PER_RACK
export const BLOOD_TYPE_LIST = BLOOD_TYPES
export const COLLECTION_CENTERS = CENTERS
