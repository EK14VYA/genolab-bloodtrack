import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./lib/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import InventoryLog from "./pages/InventoryLog"
import StorageMap from "./pages/StorageMap"
import AddSample from "./pages/AddSample"

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><InventoryLog /></ProtectedRoute>} />
          <Route path="/storage-map" element={<ProtectedRoute><StorageMap /></ProtectedRoute>} />
          <Route path="/add-sample" element={<ProtectedRoute adminOnly><AddSample /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
