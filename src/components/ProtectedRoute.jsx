import { Navigate } from "react-router-dom"
import { useAuth } from "../lib/AuthContext"

export default function ProtectedRoute({ children, adminOnly }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return children
}
